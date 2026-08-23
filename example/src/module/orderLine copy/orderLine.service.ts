import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { OrderLineRepository } from "./orderLine.repository";
import { ORDER_LINE_TYPES } from "./orderLine.types";
import { OrderLine } from "@/database/models/company/OrderLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/module/attribute";
import { SERVICE_TYPES, ServiceRepository } from "@/module/service";

@injectable()
export class OrderLineService extends BaseService<OrderLine> {
  protected repository: OrderLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(ORDER_LINE_TYPES.OrderLineRepository)
    repository: OrderLineRepository,
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
    data: DeepPartial<OrderLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.productRepository.attachInfo(data, manager);
    await this.attributeRepository.attachUnitInfo(data, manager);
    await this.serviceRepository.attachInfo(data, manager);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<OrderLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
