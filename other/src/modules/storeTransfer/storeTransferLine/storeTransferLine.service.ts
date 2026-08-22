import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { StoreTransferLineRepository } from "./storeTransferLine.repository";
import { STORE_TRANSFER_LINE_TYPES } from "./storeTransferLine.types";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { BadRequestError, IError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { STORE_TRANSFER_TYPES } from "../storeTransfer.types";
import { StoreTransferService } from "../storeTransfer.service";
import { StoreTransferRepository } from "../storeTransfer.repository";
import logger from "@/shared/utils/logger";
import { INVENTORY_TYPES } from "@/modules/inventory/inventory.types";
import { InventoryRecalculateService } from "@/modules/inventory/inventoryRecalculate.service";
import { PRODUCT_TYPES, ProductRepository } from "@/modules/product";
import { config } from "@/config/env";
import { InventoryRefTypeEnum } from "@/shared/constants/enum";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";

/**
 * StoreTransferLine Service - Tenant Entity
 */
@injectable()
export class StoreTransferLineService extends BaseService<StoreTransferLine> {
  protected repository: StoreTransferLineRepository;
  protected uniqueFields: (keyof StoreTransferLine)[] = ["productVariantId"];
  protected uniqueScope: (keyof StoreTransferLine)[] = ["transferId"];
  protected searchableFields = ["note"]; // Note from BaseEntity

  constructor(
    @inject(STORE_TRANSFER_LINE_TYPES.StoreTransferLineRepository)
    repository: StoreTransferLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(STORE_TRANSFER_TYPES.StoreTransferRepository)
    private storeTransferRepository: StoreTransferRepository,
    @inject(STORE_TRANSFER_TYPES.StoreTransferService)
    private storeTransferService: StoreTransferService,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private recalculateService: InventoryRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<StoreTransferLine>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: IError[] = [];
    const { transferId } = req?.params as any;
    data.transferId = transferId;

    // Set sortOrder
    const maxSortOrderLine = await this.repository.findOne({
      where: { transferId },
      order: { sortOrder: "DESC" },
    });
    data.sortOrder =
      (maxSortOrderLine?.sortOrder || 0) + config.SORT_ORDER_STEP;

    const productVariantSnapshot =
      await this.productRepository.getProductVariantSnapshot(
        data.productVariantId!,
      );

    if (!productVariantSnapshot) {
      errors.push({
        field: "productVariantId",
        code: ErrorsMessages.invalid,
      });
    } else data.productVariantSnapshot = productVariantSnapshot;

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<StoreTransferLine>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Lấy line hiện tại
    const currentLine = await this.repository.findById(id);
    if (!currentLine) {
      throw new BadRequestError("Line not found", {
        field: "id",
        code: ErrorsMessages.not_found,
      });
    }

    // Lấy transfer để kiểm tra occurredAt
    const transfer = await this.storeTransferRepository.findOne({
      where: { id: currentLine.transferId },
    });

    // Chỉ validate nếu transfer đã occurredAt (đã ghi tồn kho)
    if (!transfer?.occurredAt) {
      return;
    }

    // Nếu có thay đổi số lượng, validate delta
    if (data.quantity !== undefined && data.quantity !== currentLine.quantity) {
      const delta = data.quantity - currentLine.quantity;

      // Nếu tăng số lượng xuất (delta > 0), cần validate tồn kho
      if (delta > 0) {
        // Lấy tồn kho hiện tại của kho nguồn
        const currentStock =
          await this.recalculateService.getCurrentStockAtStore(
            currentLine.productVariantId,
            transfer.fromStoreId,
            manager,
          );

        // TODO: Tạm tắt chặn tồn âm
        // if (currentStock < delta) {
        //   throw new BadRequestError(
        //     `Không đủ hàng trong kho để tăng số lượng chuyển. ` +
        //       `Cần thêm: ${delta.toFixed(
        //         2,
        //       )}, Tồn kho hiện tại: ${currentStock.toFixed(2)}`,
        //     {
        //       field: "quantity",
        //       code: ErrorsMessages.insufficient_stock,
        //     },
        //   );
        // }
      }
      // Nếu giảm số lượng (delta < 0), luôn cho phép vì đây là hoàn kho
    }
  }

  async validateBeforeDelete(
    data: Partial<StoreTransferLine>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Không được xóa nếu chỉ còn 1 line
    const lineCount = await this.repository.count({
      where: { transferId: data.transferId },
    });
    if (lineCount <= 1) {
      throw new BadRequestError(
        "Cannot delete the last line of a store transfer.",
        {
          field: "id",
          code: ErrorsMessages.is_last_item,
        },
      );
    }
  }

  async handleTransferLineChanged(
    data: StoreTransferLine,
    manager: EntityManager,
  ): Promise<void> {
    const transfer = await this.storeTransferRepository.findOne({
      where: { id: data.transferId },
    });

    if (!transfer) {
      logger.error(
        `StoreTransfer not found when recalculating. TransferId: ${data.transferId}`,
      );
      return;
    }

    if (transfer.occurredAt) {
      const baseNodes = [
        {
          variantId: data.productVariantId,
          storeId: transfer.fromStoreId,
          fromDate: transfer.occurredAt,
        },
        {
          variantId: data.productVariantId,
          storeId: transfer.toStoreId,
          fromDate: transfer.occurredAt,
        },
      ];

      const affectedNodes =
        await this.recalculateService.collectAffectedInventoryNodes(
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
            refId: transfer.id,
          },
        })),
      );

      logger.info(
        `[STORE_TRANSFER_LINE] Enqueued inventory recalculate for transfer ${transfer.id}`,
      );
    }
  }

  async actionAfterCreate(
    data: StoreTransferLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleTransferLineChanged(data, manager);
  }

  async actionAfterUpdate(
    data: StoreTransferLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleTransferLineChanged(data, manager);
  }

  async actionAfterDelete(
    data: StoreTransferLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleTransferLineChanged(data, manager);
  }
}
