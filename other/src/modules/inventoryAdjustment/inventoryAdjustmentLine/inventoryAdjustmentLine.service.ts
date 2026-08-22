import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryAdjustmentLineRepository } from "./inventoryAdjustmentLine.repository";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { BadRequestError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { INVENTORY_ADJUSTMENT_TYPES } from "../inventoryAdjustment.types";
import { InventoryAdjustmentService } from "../inventoryAdjustment.service";
import { InventoryAdjustmentRepository } from "../inventoryAdjustment.repository";
import logger from "@/shared/utils/logger";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import { config } from "@/config/env";
import { PRODUCT_VARIANT_TYPES } from "@/modules/product/productVariant/productVariant.types";
import { ProductVariantRepository } from "@/modules/product/productVariant/productVariant.repository";
import { InventoryRefTypeEnum } from "@/shared/constants/enum";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";
import { INVENTORY_TYPES } from "@/modules/inventory/inventory.types";
import { InventoryRecalculateService } from "@/modules/inventory/inventoryRecalculate.service";

/**
 * InventoryAdjustmentLine Service - Tenant Entity
 */
@injectable()
export class InventoryAdjustmentLineService extends BaseService<InventoryAdjustmentLine> {
  protected repository: InventoryAdjustmentLineRepository;
  protected uniqueFields: (keyof InventoryAdjustmentLine)[] = [
    "productVariantId",
  ];
  protected uniqueScope: (keyof InventoryAdjustmentLine)[] = ["adjustmentId"];
  protected searchableFields = ["note"]; // Note from BaseEntity

  constructor(
    @inject(INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRepository)
    repository: InventoryAdjustmentLineRepository,
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository)
    private inventoryAdjustmentRepository: InventoryAdjustmentRepository,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepository: ProductVariantRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private inventoryRecalculateService: InventoryRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  // Kiểm tra adjustment xem đã cũ hơn 1 ngày chưa, nếu cũ hơn thì không cho tạo/sửa/xóa line nữa
  async checkIfAdjustmentIsEditable(
    adjustmentId: string,
    manager: EntityManager,
  ): Promise<void> {
    const adjustment = await this.inventoryAdjustmentRepository.findOne(
      {
        where: { id: adjustmentId },
        select: ["occurredAt"],
      },
      manager,
    );

    if (!adjustment) {
      throw new BadRequestError("Không tìm thấy phiếu điều chỉnh tồn kho.");
    }

    const now = new Date();
    const occurredAt = new Date(adjustment.occurredAt);
    const diffInMs = now.getTime() - occurredAt.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    if (diffInHours > 24) {
      throw new BadRequestError(
        "Không thể chỉnh sửa phiếu điều chỉnh tồn kho đã cũ hơn 24 giờ.",
      );
    }
  }

  async validateBeforeCreate(
    data: DeepPartial<InventoryAdjustmentLine>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { adjustmentId } = req?.params as any;

    await this.checkIfAdjustmentIsEditable(adjustmentId, manager);

    data.adjustmentId = adjustmentId;
    // costPriceAtTime là trường hệ thống tự tính theo lịch sử giao dịch, không nhận từ FE.
    delete (data as any).costPriceAtTime;

    if ((data.expectedQty ?? 0) < 0) {
      throw new BadRequestError("expectedQty không được nhỏ hơn 0", {
        field: "expectedQty",
        code: ErrorsMessages.min,
      });
    }

    // Nạp costPriceAtTime dựa trên giá hiện tại của variant
    if (data.productVariantId) {
      const variant = await this.productVariantRepository.findById(
        data.productVariantId,
        manager,
      );
      if (variant) {
        data.costPriceAtTime = variant.costPrice;
      }
    }

    // Set sortOrder
    const maxSortOrderLine = await this.repository.findOne({
      where: { adjustmentId },
      order: { sortOrder: "DESC" },
    });
    data.sortOrder =
      (maxSortOrderLine?.sortOrder || 0) + config.SORT_ORDER_STEP;
  }

  async validateBeforeDelete(
    data: Partial<InventoryAdjustmentLine>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Không được xóa nếu chỉ còn 1 line
    const lineCount = await this.repository.count({
      where: { adjustmentId: data.adjustmentId },
    });
    if (lineCount <= 1) {
      throw new BadRequestError(
        "Cannot delete the last line of an inventory adjustment.",
        {
          field: "id",
          code: ErrorsMessages.is_last_item,
        },
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<InventoryAdjustmentLine>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const existing = await this.repository.findById(id, manager);
    if (!existing) {
      throw new BadRequestError("Không tìm thấy dòng điều chỉnh", {
        field: "id",
        code: ErrorsMessages.not_found,
      });
    }

    await this.checkIfAdjustmentIsEditable(existing.adjustmentId, manager);

    // costPriceAtTime là trường hệ thống quản lý, không cho cập nhật thủ công.
    if ("costPriceAtTime" in data) {
      delete (data as any).costPriceAtTime;
    }

    if (data.expectedQty !== undefined && data.expectedQty < 0) {
      throw new BadRequestError("expectedQty không được nhỏ hơn 0", {
        field: "expectedQty",
        code: ErrorsMessages.min,
      });
    }
  }

  async handleAdjustmentLineChanged(
    data: InventoryAdjustmentLine,
    manager: EntityManager,
  ): Promise<void> {
    const adjustment = await this.inventoryAdjustmentRepository.findOne({
      where: { id: data.adjustmentId },
    });

    if (!adjustment) {
      logger.error(
        `InventoryAdjustment not found when recalculating. AdjustmentId: ${data.adjustmentId}`,
      );
      return;
    }

    await InventoryRecalculateQueue.enqueue({
      variantId: data.productVariantId,
      storeId: adjustment.storeId,
      fromDate: adjustment.occurredAt,
      source: {
        sourceType: InventoryRefTypeEnum.ADJUST,
        refId: adjustment.id,
      },
    });
  }

  async actionAfterCreate(
    data: InventoryAdjustmentLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAdjustmentLineChanged(data, manager);
  }

  async actionAfterUpdate(
    data: InventoryAdjustmentLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAdjustmentLineChanged(data, manager);
  }

  async actionAfterDelete(
    data: InventoryAdjustmentLine,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAdjustmentLineChanged(data, manager);
  }
}
