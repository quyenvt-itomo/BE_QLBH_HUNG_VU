import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { QuotationRequestLineRepository } from "./quotationRequestLine.repository";
import { QUOTATION_REQUEST_LINE_TYPES } from "./quotationRequestLine.types";
import { QuotationRequestLine } from "@/database/models/company/QuotationRequestLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";

@injectable()
export class QuotationRequestLineService extends BaseService<QuotationRequestLine> {
  protected repository: QuotationRequestLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineRepository)
    repository: QuotationRequestLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<QuotationRequestLine>,
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
    data: DeepPartial<QuotationRequestLine>,
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
