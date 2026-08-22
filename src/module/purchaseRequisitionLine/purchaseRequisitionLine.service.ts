import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PurchaseRequisitionLineRepository } from "./purchaseRequisitionLine.repository";
import { PURCHASE_REQUISITION_LINE_TYPES } from "./purchaseRequisitionLine.types";
import { PurchaseRequisitionLine } from "@/database/models/company/PurchaseRequisitionLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";

@injectable()
export class PurchaseRequisitionLineService extends BaseService<PurchaseRequisitionLine> {
  protected repository: PurchaseRequisitionLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineRepository)
    repository: PurchaseRequisitionLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<PurchaseRequisitionLine>,
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
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PurchaseRequisitionLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
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
  }
}
