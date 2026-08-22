import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { BillOfMaterialRepository } from "./billOfMaterial.repository";
import { BILL_OF_MATERIAL_TYPES } from "./billOfMaterial.types";
import { BillOfMaterial } from "@/database/models/company/BillOfMaterial";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";

@injectable()
export class BillOfMaterialService extends BaseService<BillOfMaterial> {
  protected repository: BillOfMaterialRepository;
  protected uniqueFields: (keyof BillOfMaterial)[] = [];
  protected searchableFields = [];

  constructor(
    @inject(BILL_OF_MATERIAL_TYPES.BillOfMaterialRepository)
    repository: BillOfMaterialRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<BillOfMaterial>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<BillOfMaterial>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}
}
