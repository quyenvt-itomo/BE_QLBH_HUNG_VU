import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { QuotationLineRepository } from "./quotationLine.repository";
import { QUOTATION_LINE_TYPES } from "./quotationLine.types";
import { QuotationLine } from "@/database/models/company/QuotationLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";
import { SERVICE_TYPES, ServiceRepository } from "@/module/service";

@injectable()
export class QuotationLineService extends BaseService<QuotationLine> {
  protected repository: QuotationLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(QUOTATION_LINE_TYPES.QuotationLineRepository)
    repository: QuotationLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(SERVICE_TYPES.ServiceRepository)
    private serviceRepository: ServiceRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<QuotationLine>,
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
    if (data.serviceId) {
      data.serviceSnapshot = await this.serviceRepository.getSnapshot(
        data.serviceId,
        manager,
      );
    }
    if (data.materialId) {
      data.materialSnapshot = await this.productRepository.getSnapshot(
        data.materialId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<QuotationLine>,
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
    if (data.serviceId !== undefined) {
      data.serviceSnapshot = data.serviceId
        ? await this.serviceRepository.getSnapshot(data.serviceId, manager)
        : null;
    }
    if (data.materialId !== undefined) {
      data.materialSnapshot = data.materialId
        ? await this.productRepository.getSnapshot(data.materialId, manager)
        : null;
    }
  }
}
