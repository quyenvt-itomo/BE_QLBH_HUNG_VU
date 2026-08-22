import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PurchaseLineRepository } from "./purchaseLine.repository";
import { PURCHASE_LINE_TYPES } from "./purchaseLine.types";
import { PurchaseLine } from "@/database/models/company/PurchaseLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";

@injectable()
export class PurchaseLineService extends BaseService<PurchaseLine> {
  protected repository: PurchaseLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(PURCHASE_LINE_TYPES.PurchaseLineRepository)
    repository: PurchaseLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<PurchaseLine>,
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
    data: DeepPartial<PurchaseLine>,
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
