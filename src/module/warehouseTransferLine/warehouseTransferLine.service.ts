import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { WarehouseTransferLineRepository } from "./warehouseTransferLine.repository";
import { WAREHOUSE_TRANSFER_LINE_TYPES } from "./warehouseTransferLine.types";
import { WarehouseTransferLine } from "@/database/models/company/WarehouseTransferLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class WarehouseTransferLineService extends BaseService<WarehouseTransferLine> {
  protected repository: WarehouseTransferLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineRepository)
    repository: WarehouseTransferLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<WarehouseTransferLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.productId) {
      data.productSnapshot = await this.productRepository.getSnapshot(
        data.productId,
        manager,
      );
    }
    if (data.unitId) {
      data.unitSnapshot = await this.attributeRepository.getSnapshot(
        data.unitId,
        manager,
      );
    }
    if (data.productId && data.unitId) {
      await this.productRepository.attachUnitConversion(data, manager);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<WarehouseTransferLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const current = await this.repository.findById(id, manager);
    if (
      current &&
      ((data.productId && data.productId !== current.productId) ||
        (data.unitId && data.unitId !== current.unitId))
    ) {
      throw new BadRequestError(
        "Không thể đổi hàng hóa hoặc đơn vị tính của dòng chuyển kho; hãy hủy phiếu để tạo lại",
      );
    }
    if (current) data.conversionRateAtTime = current.conversionRateAtTime;
    if (data.productId !== undefined) {
      data.productSnapshot = data.productId
        ? await this.productRepository.getSnapshot(data.productId, manager)
        : null;
    }
    if (data.unitId !== undefined) {
      data.unitSnapshot = data.unitId
        ? await this.attributeRepository.getSnapshot(data.unitId, manager)
        : null;
    }
    if (data.productId && data.unitId) {
      await this.productRepository.attachUnitConversion(data, manager);
    }
  }
}
