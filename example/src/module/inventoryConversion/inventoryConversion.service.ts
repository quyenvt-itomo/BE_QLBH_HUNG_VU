import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryConversionRepository } from "./inventoryConversion.repository";
import { INVENTORY_CONVERSION_TYPES } from "./inventoryConversion.types";
import { InventoryConversion } from "@/database/models/company/InventoryConversion";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";

@injectable()
export class InventoryConversionService extends BaseService<InventoryConversion> {
  protected repository: InventoryConversionRepository;
  protected uniqueFields: (keyof InventoryConversion)[] = ["code"];
  protected uniqueScope?: (keyof InventoryConversion)[] = ["storeId"];
  protected searchableFields = ["code", "reason"];
  protected timeField: keyof InventoryConversion = "timeAt";

  constructor(
    @inject(INVENTORY_CONVERSION_TYPES.InventoryConversionRepository)
    repository: InventoryConversionRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<InventoryConversion>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.staffId) {
      data.staffSnapshot = await this.employeeRepository.getSnapshot(
        data.staffId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<InventoryConversion>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.staffId !== undefined) {
      data.staffSnapshot = data.staffId
        ? await this.employeeRepository.getSnapshot(data.staffId, manager)
        : null;
    }
  }
}
