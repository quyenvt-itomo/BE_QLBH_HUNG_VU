import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PartnerDebtAdjustmentRepository } from "./partnerDebtAdjustment.repository";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "./partnerDebtAdjustment.types";
import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import e, { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { PARTNER_DEBT_TYPES } from "../partnerDebt/partnerDebt.types";
import { PartnerDebtRecalculateService } from "../partnerDebt/partnerDebtRecalculate.service";
import { EMPLOYEE_TYPES, EmployeeRepository } from "../employee";

/**
 * PartnerDebtAdjustment Service - Tenant Entity
 */
@injectable()
export class PartnerDebtAdjustmentService extends BaseService<PartnerDebtAdjustment> {
  protected repository: PartnerDebtAdjustmentRepository;
  protected uniqueFields: (keyof PartnerDebtAdjustment)[] = ["code"];
  protected uniqueScope?: (keyof PartnerDebtAdjustment)[] = ["side"];
  protected searchableFields = [
    "code",
    "reason",
    "note",
    "partner.name",
    "partner.code",
    "adjustedBySnapshot.name",
    "adjustedBySnapshot.code",
  ];
  protected summaryFields?: string[] = ["totalAdjustmentAmount"];

  constructor(
    @inject(PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRepository)
    repository: PartnerDebtAdjustmentRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtRecalculateService)
    private partnerDebtRecalculateService: PartnerDebtRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  async handleAfterChangedData(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
  ): Promise<void> {
    const oldData = await this.findById(data.id);

    // Lấy thời điểm xảy ra thay đổi để tính lại công nợ
    const fromDate = this.getEarliestDate(data.occurredAt, oldData?.occurredAt);

    const partnerIds = this.collectUniqueIds([
      data.partnerId,
      oldData?.partnerId,
    ]);

    await this.partnerDebtRecalculateService.recalculateFromDate(
      data.storeId,
      fromDate,
      manager,
      partnerIds,
    );
  }

  async validateBeforeCreate(
    data: DeepPartial<PartnerDebtAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.adjustedById) {
      const adjustedBySnapshot =
        await this.employeeRepository.getEmployeeSnapshot(data.adjustedById);
      data.adjustedBySnapshot = adjustedBySnapshot;
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<PartnerDebtAdjustment>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (data.adjustedById) {
      const adjustedBySnapshot =
        await this.employeeRepository.getEmployeeSnapshot(data.adjustedById);
      data.adjustedBySnapshot = adjustedBySnapshot;
    } else if (data.adjustedById === null) {
      data.adjustedBySnapshot = null;
    }
  }

  async actionAfterCreate(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterUpdate(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }

  async actionAfterDelete(
    data: PartnerDebtAdjustment,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager);
  }
}
