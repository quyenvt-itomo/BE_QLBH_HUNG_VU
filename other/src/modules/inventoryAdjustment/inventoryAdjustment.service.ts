import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryAdjustmentRepository } from "./inventoryAdjustment.repository";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { config } from "@/config/env";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { PRODUCT_VARIANT_TYPES } from "../product/productVariant/productVariant.types";
import { ProductVariantRepository } from "../product/productVariant/productVariant.repository";
import { InventoryRefTypeEnum } from "@/shared/constants/enum";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";
import { INVENTORY_TYPES } from "@/modules/inventory/inventory.types";
import { InventoryRecalculateService } from "@/modules/inventory/inventoryRecalculate.service";

/**
 * InventoryAdjustment Service - Tenant Entity
 * Module điều chỉnh tồn kho - tính toán deltaQty
 */
@injectable()
export class InventoryAdjustmentService extends BaseService<InventoryAdjustment> {
  protected repository: InventoryAdjustmentRepository;
  protected uniqueFields: (keyof InventoryAdjustment)[] = ["code"];
  protected searchableFields = ["code", "reason", "note"];
  protected summaryFields?: string[] = [
    "totalAdjustmentQty",
    "totalAdjustmentValue",
  ];

  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository)
    repository: InventoryAdjustmentRepository,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepository: ProductVariantRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private inventoryRecalculateService: InventoryRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  // protected async attachMoreDataToEntities(
  //   entities: InventoryAdjustment[],
  //   options: IFindOptions<InventoryAdjustment>,
  // ): Promise<void> {
  //   await super.attachMoreDataToEntities(entities, options);

  //   entities.forEach((entity) => {
  //     (entity as any).totalAdjustmentQty =
  //       (entity as any).totaladjustmentqty ?? 0;
  //     (entity as any).totalAdjustmentValue =
  //       (entity as any).totaladjustmentvalue ?? 0;
  //     delete (entity as any).totaladjustmentqty;
  //     delete (entity as any).totaladjustmentvalue;
  //   });
  // }

  // protected async attachMoreDataToEntity(
  //   entity: InventoryAdjustment,
  //   req?: Request,
  // ): Promise<void> {
  //   await super.attachMoreDataToEntity(entity, req);
  //   (entity as any).totalAdjustmentQty =
  //     (entity as any).totaladjustmentqty ?? 0;
  //   (entity as any).totalAdjustmentValue =
  //     (entity as any).totaladjustmentvalue ?? 0;
  //   delete (entity as any).totaladjustmentqty;
  //   delete (entity as any).totaladjustmentvalue;
  // }

  async validateBeforeCreate(
    data: DeepPartial<InventoryAdjustment>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: Array<{ field: string; code: string }> = [];

    // Không cho thêm phiếu có occurredAt cũ hơn 1 ngày so với hiện tại (tránh tạo phiếu điều chỉnh với occurredAt quá xa)
    // if (data.occurredAt) {
    //   const now = new Date();
    //   const oneDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    //   if (data.occurredAt < oneDayAgo) {
    //     throw new BadRequestError(
    //       "Không thể tạo phiếu điều chỉnh với ngày ghi nhận cách đây hơn 1 tuần",
    //     );
    //   }
    // }

    // Sort order
    data.lines = data.lines?.map((line, idx) => ({
      ...line,
      sortOrder: (idx + 1) * config.SORT_ORDER_STEP,
    }));

    data.lines?.forEach((line, idx) => {
      if ((line.expectedQty ?? 0) < 0) {
        errors.push({
          field: `lines.${idx}.expectedQty`,
          code: ErrorsMessages.min,
        });
      }
    });

    // Nạp costPriceAtTime cho từng line
    if (data.lines) {
      for (const line of data.lines) {
        if (line.productVariantId) {
          const variant = await this.productVariantRepository.findById(
            line.productVariantId,
            manager,
          );
          if (variant) {
            line.costPriceAtTime = variant.costPrice;
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }
  }

  // Khô cho sửa xóa phiếu cũ hơn 1 ngày so với hiện tại (tránh sửa xóa phiếu điều chỉnh với occurredAt quá xa)
  async validateBeforeUpdate(
    id: string,
    data: Partial<InventoryAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const existing = await this.repository.findById(id, manager);
    if (!existing) {
      throw new BadRequestError("Phiếu điều chỉnh không tồn tại");
    }

    // if (existing.occurredAt) {
    //   const now = new Date();
    //   const oneDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    //   if (existing.occurredAt < oneDayAgo) {
    //     throw new BadRequestError(
    //       "Không thể sửa phiếu điều chỉnh với ngày ghi nhận cách đây hơn 1 tuần",
    //     );
    //   }
    // }
  }
  async validateBeforeDelete(
    data: Partial<InventoryAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // if (data.occurredAt) {
    //   const now = new Date();
    //   const oneDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    //   if (data.occurredAt < oneDayAgo) {
    //     throw new BadRequestError(
    //       "Không thể xóa phiếu điều chỉnh với ngày ghi nhận cách đây hơn 1 tuần",
    //     );
    //   }
    // }
  }

  async handleAfterChangedData(
    data: InventoryAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    const fromDate =
      oldData && oldData.occurredAt > data.occurredAt
        ? oldData.occurredAt
        : data.occurredAt;

    const variantIds = this.collectUniqueIds([
      ...(data.lines?.map((line) => line.productVariantId) || []),
      ...(oldData?.lines?.map((line) => line.productVariantId) || []),
    ]);
    const storeIds = this.collectUniqueIds([data.storeId, oldData?.storeId]);

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
          sourceType: InventoryRefTypeEnum.ADJUST,
          refId: data.id,
        },
      })),
    );
  }

  /**
   * Hook: Sau khi tạo InventoryAdjustment
   * - Nếu có occurredAt → Recalculate inventory từ thời điểm đó
   * - Phải dùng recalculate vì Adjustment có thể được tạo với occurredAt trong quá khứ
   * - Nếu chỉ ghi thêm transaction thì các transaction sau sẽ có balance SAI
   */
  async actionAfterCreate(
    data: InventoryAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  /**
   * Hook: Sau khi cập nhật InventoryAdjustment
   * - Recalculate từ thời điểm occurredAt
   */
  async actionAfterUpdate(
    data: InventoryAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  /**
   * Hook: Sau khi xóa InventoryAdjustment
   * - Recalculate từ thời điểm bị xóa
   */
  async actionAfterDelete(
    data: InventoryAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
