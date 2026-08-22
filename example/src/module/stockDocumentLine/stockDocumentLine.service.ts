import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { StockDocumentLineRepository } from "./stockDocumentLine.repository";
import { STOCK_DOCUMENT_LINE_TYPES } from "./stockDocumentLine.types";
import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";

@injectable()
export class StockDocumentLineService extends BaseService<StockDocumentLine> {
  protected repository: StockDocumentLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineRepository)
    repository: StockDocumentLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<StockDocumentLine>,
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
    data: DeepPartial<StockDocumentLine>,
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
