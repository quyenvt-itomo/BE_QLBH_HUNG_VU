import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { VatDebtAdjustmentRepository } from "./vatDebtAdjustment.repository";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "./vatDebtAdjustment.types";
import { VatDebtAdjustment } from "@/database/models/store/VatDebtAdjustment";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { VAT_DEBT_TYPES } from "../vatDebt/vatDebt.types";
import { VatDebtRecalculateService } from "../vatDebt/vatDebtRecalculate.service";
import { EMPLOYEE_TYPES, EmployeeRepository } from "../employee";

/**
 * VatDebtAdjustment Service - Tenant Entity
 */
@injectable()
export class VatDebtAdjustmentService extends BaseService<VatDebtAdjustment> {
  protected repository: VatDebtAdjustmentRepository;
  protected uniqueFields: (keyof VatDebtAdjustment)[] = ["code"];
  protected searchableFields = ["code", "reason", "note"];
  protected summaryFields?: string[] = ["totalAdjustmentAmount"];

  constructor(
    @inject(VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRepository)
    vatDebtAdjustmentRepository: VatDebtAdjustmentRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(VAT_DEBT_TYPES.VatDebtRecalculateService)
    private vatDebtRecalculateService: VatDebtRecalculateService,
  ) {
    super();
    this.repository = vatDebtAdjustmentRepository;
  }

  async validateBeforeCreate(
    data: DeepPartial<VatDebtAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.adjustedById) {
      data.adjustedBySnapshot =
        await this.employeeRepository.getEmployeeSnapshot(data.adjustedById);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<VatDebtAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.adjustedById) {
      data.adjustedBySnapshot =
        await this.employeeRepository.getEmployeeSnapshot(data.adjustedById);
    }
  }

  async handleAfterChangedData(
    data: VatDebtAdjustment,
    manager: EntityManager,
  ) {
    const oldData = await this.findById(data.id);

    const occurredAt = this.getEarliestDate(
      data.occurredAt,
      oldData?.occurredAt,
    );

    await this.vatDebtRecalculateService.recalculateFromDate(
      data.storeId,
      occurredAt,
      manager,
    );
  }

  async actionAfterCreate(
    data: VatDebtAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: VatDebtAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: VatDebtAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
