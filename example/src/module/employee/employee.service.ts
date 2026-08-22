import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { Employee } from "@/database/models/company/Employee";
import { EmployeeRepository } from "./employee.repository";
import { EMPLOYEE_TYPES } from "./employee.types";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { EmployeeContract } from "@/database/models/company/EmployeeContract";
import { ValidationError } from "@/shared/types/errors";

@injectable()
export class EmployeeService extends BaseService<Employee> {
  protected repository: EmployeeRepository;
  protected uniqueFields: (keyof Employee)[] = ["code", "email", "phone"];
  protected uniqueScope?: (keyof Employee)[] | undefined = ["companyId"];
  protected searchableFields = ["code", "name", "email", "phone", "note"];

  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    repository: EmployeeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Employee>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const contracts = (data as any).contracts as
      | DeepPartial<EmployeeContract>[]
      | undefined;
    if (!contracts?.length) return;

    const dupErrors = this.checkDuplicate(
      contracts as Record<string, any>[],
      ["contractNumber"],
      "contracts",
    );
    if (dupErrors.length > 0) {
      throw new ValidationError("Dá»¯ liá»‡u khÃ´ng há»£p lá»‡", dupErrors);
    }

    (data as any).contracts = contracts.map((contract) => ({
      ...contract,
      employeeId: undefined,
    }));
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Employee>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const incomingContracts = (data as any).contracts as
      | DeepPartial<EmployeeContract>[]
      | undefined;
    delete (data as any).contracts;

    if (!incomingContracts) return;

    const dupErrors = this.checkDuplicate(
      incomingContracts as Record<string, any>[],
      ["contractNumber"],
      "contracts",
    );
    if (dupErrors.length > 0) {
      throw new ValidationError("Dá»¯ liá»‡u khÃ´ng há»£p lá»‡", dupErrors);
    }

    await this.syncContracts(id, incomingContracts, manager);
  }

  private async syncContracts(
    employeeId: string,
    incoming: DeepPartial<EmployeeContract>[],
    manager: EntityManager,
  ): Promise<void> {
    const existing = await manager.find(EmployeeContract, {
      where: { employeeId } as any,
    });

    const existingById = new Map(existing.map((item) => [item.id, item]));
    const incomingIds = new Set(
      incoming.map((item) => item.id).filter((id): id is string => !!id),
    );

    const invalidIds = Array.from(incomingIds).filter(
      (contractId) => !existingById.has(contractId),
    );

    if (invalidIds.length > 0) {
      throw new ValidationError("Dá»¯ liá»‡u khÃ´ng há»£p lá»‡", [
        {
          field: "contracts",
          message: "CÃ³ há»£p Ä‘á»“ng khÃ´ng thuá»™c nhÃ¢n viÃªn nÃ y",
        },
      ]);
    }

    const toDeleteIds = existing
      .filter((item) => !incomingIds.has(item.id))
      .map((item) => item.id);

    if (toDeleteIds.length > 0) {
      await manager.softDelete(EmployeeContract, toDeleteIds);
    }

    const toSave = incoming.map((item) => ({
      ...item,
      employeeId,
    }));

    if (toSave.length > 0) {
      await manager.save(EmployeeContract, toSave as any);
    }
  }
}
