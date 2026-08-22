import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { WarehouseRepository } from "./warehouse.repository";
import { WAREHOUSE_TYPES } from "./warehouse.types";
import { Warehouse } from "@/database/models/company/Warehouse";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";

@injectable()
export class WarehouseService extends BaseService<Warehouse> {
  protected repository: WarehouseRepository;
  protected uniqueFields: (keyof Warehouse)[] = ["code"];
  protected uniqueScope?: (keyof Warehouse)[] = ["companyId"];
  protected searchableFields = ["name", "code", "note"];

  constructor(
    @inject(WAREHOUSE_TYPES.WarehouseRepository)
    repository: WarehouseRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Warehouse>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Warehouse>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
