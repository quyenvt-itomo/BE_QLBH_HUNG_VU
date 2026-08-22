import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { StoreTransferRepository } from "./storeTransfer.repository";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { BadRequestError, IError } from "@/shared/types/errors";
import logger from "@/shared/utils/logger";
import { PRODUCT_TYPES, ProductRepository } from "../product";
import { ErrorsMessages } from "@/shared/constants/errors";
import { config } from "@/config/env";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { InventoryRefTypeEnum } from "@/shared/constants/enum";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";
import { INVENTORY_TYPES } from "@/modules/inventory/inventory.types";
import { InventoryRecalculateService } from "@/modules/inventory/inventoryRecalculate.service";

/**
 * StoreTransfer Service - Tenant Entity
 * Module chuyển kho - không có tính toán phức tạp
 * Chỉ ghi nhận chuyển hàng từ kho này sang kho khác
 */
@injectable()
export class StoreTransferService extends BaseService<StoreTransfer> {
  protected repository: StoreTransferRepository;
  protected uniqueFields: (keyof StoreTransfer)[] = ["code"];
  protected searchableFields = ["code", "reason", "note"];

  constructor(
    @inject(STORE_TRANSFER_TYPES.StoreTransferRepository)
    repository: StoreTransferRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private inventoryRecalculateService: InventoryRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<StoreTransfer>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (!manager) {
      throw new BadRequestError("Missing transaction manager");
    }

    const errors: IError[] = [];
    // Validate không thể chuyển từ kho sang chính nó
    if (data.fromStoreId === data.toStoreId) {
      throw new Error("Cannot transfer from store to itself");
    }

    // Tính conversion rate nếu chưa có
    if (data.lines) {
      const requestedByVariant = new Map<string, number>();

      data.lines = await Promise.all(
        data.lines.map(async (line, idx) => {
          const qty = Number(line.quantity || 0);
          if (qty <= 0) {
            errors.push({
              field: `lines.${idx}.quantity`,
              code: ErrorsMessages.min,
            });
          }

          if (line.productVariantId) {
            requestedByVariant.set(
              line.productVariantId,
              (requestedByVariant.get(line.productVariantId) || 0) + qty,
            );
          }

          const productVariantSnapshot =
            await this.productRepository.getProductVariantSnapshot(
              line.productVariantId!,
            );

          if (!productVariantSnapshot) {
            errors.push({
              field: `lines.${idx}.productVariantId`,
              code: ErrorsMessages.invalid,
            });
            return line;
          }

          return {
            ...line,
            sortOrder: (idx + 1) * config.SORT_ORDER_STEP,
            productVariantSnapshot: productVariantSnapshot,
          };
        }),
      );

      if (data.fromStoreId) {
        for (const [variantId, requestedQty] of requestedByVariant.entries()) {
          const stockResult = await manager
            .createQueryBuilder(InventoryTransaction, "it")
            .select(
              "COALESCE(SUM(CASE WHEN it.type = 'in' THEN it.quantity ELSE -it.quantity END), 0)",
              "qty",
            )
            .where("it.productVariantId = :variantId", { variantId })
            .andWhere("it.storeId = :storeId", { storeId: data.fromStoreId })
            .andWhere("it.deletedAt IS NULL")
            .getRawOne();

          const availableQty = parseFloat(stockResult?.qty || "0");

          // TODO: Tạm tắt chặn tồn âm
          // if (availableQty < requestedQty) {
          //   errors.push({
          //     field: "lines",
          //     code: ErrorsMessages.insufficient_stock,
          //     message:
          //       `Không đủ tồn để chuyển kho cho variant ${variantId}. ` +
          //       `Cần ${requestedQty.toFixed(2)}, hiện có ${availableQty.toFixed(2)} tại kho nguồn.`,
          //   } as any);
          // }
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }
  }

  async handleTransferChanged(
    data: StoreTransfer,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);
    const variantIds = this.collectUniqueIds([
      ...(data.lines?.map((line) => line.productVariantId) || []),
      ...(oldData?.lines?.map((line) => line.productVariantId) || []),
    ]);
    const storeIds = this.collectUniqueIds([
      data.fromStoreId,
      data.toStoreId,
      oldData?.fromStoreId,
      oldData?.toStoreId,
    ]);

    if (!variantIds.length || !storeIds.length) {
      return;
    }

    const baseNodes = variantIds.flatMap((variantId) =>
      storeIds.map((storeId) => ({
        variantId,
        storeId,
        fromDate,
      })),
    );

    const affectedNodes =
      await this.inventoryRecalculateService.collectAffectedInventoryNodes(
        baseNodes,
        manager,
      );

    await InventoryRecalculateQueue.enqueueMany(
      affectedNodes.map((node) => ({
        variantId: node.variantId,
        storeId: node.storeId,
        fromDate: node.fromDate,
        source: {
          sourceType: InventoryRefTypeEnum.TRANSFER,
          refId: data.id,
        },
      })),
    );
  }

  /**
   * Hook: Sau khi tạo StoreTransfer
   * - Nếu có occurredAt → Recalculate inventory từ thời điểm đó
   * - Phải dùng recalculate vì Transfer có thể được tạo với occurredAt trong quá khứ
   * - Nếu chỉ ghi thêm transaction thì các transaction sau sẽ có balance SAI
   */
  async actionAfterCreate(
    data: StoreTransfer,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleTransferChanged(data, manager);
  }

  /**
   * Hook: Sau khi cập nhật StoreTransfer
   * - Recalculate từ thời điểm occurredAt
   */
  async actionAfterUpdate(
    data: StoreTransfer,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleTransferChanged(data, manager);
  }

  /**
   * Hook: Sau khi xóa StoreTransfer
   * - Recalculate từ thời điểm bị xóa
   */
  async actionAfterDelete(
    data: StoreTransfer,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleTransferChanged(data, manager);
  }
}
