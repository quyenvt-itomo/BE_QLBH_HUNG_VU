import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { VatDebtAdjustmentRepository } from "./vatDebtAdjustment.repository";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "./vatDebtAdjustment.types";
import { VatDebtAdjustment } from "@/database/models/company/VatDebtAdjustment";
import { DeepPartial, EntityManager } from "typeorm";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";
import { VAT_DEBT_SYNC_TYPES, VatDebtSyncService } from "@/module/vatDebtSync";
import { VatTransactionTypeEnum } from "@/database/models/company/VatDebtTransaction";
import { TransactionTypeEnum } from "@/shared/constants/enum";

@injectable()
export class VatDebtAdjustmentService extends BaseService<VatDebtAdjustment> {
  protected repository: VatDebtAdjustmentRepository;
  protected uniqueFields: (keyof VatDebtAdjustment)[] = ["code"];
  protected uniqueScope?: (keyof VatDebtAdjustment)[] = ["companyId"];
  protected searchableFields = ["code"];

  constructor(
    @inject(VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRepository)
    repository: VatDebtAdjustmentRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(VAT_DEBT_SYNC_TYPES.VatDebtSyncService)
    private vatDebtSync: VatDebtSyncService,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<VatDebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.adjustedById) {
      data.adjustedBySnapshot = await this.employeeRepository.getSnapshot(
        data.adjustedById,
        manager,
      );
    }
    await this.recompute(data, manager);
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<VatDebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.adjustedById !== undefined) {
      data.adjustedBySnapshot = data.adjustedById
        ? await this.employeeRepository.getSnapshot(data.adjustedById, manager)
        : null;
    }
    if (data.expectedAmount !== undefined || data.occurredAt !== undefined) {
      await this.recompute(data, manager);
    }
  }

  async actionAfterCreate(
    data: VatDebtAdjustment,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.vatDebtSync.syncForAdjustment(data, manager);
  }

  async actionAfterUpdate(
    data: VatDebtAdjustment,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.vatDebtSync.syncForAdjustment(data, manager);
  }

  async actionAfterDelete(
    data: VatDebtAdjustment,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.vatDebtSync.removeByRef(
      manager,
      VatTransactionTypeEnum.ADJUSTMENT,
      data.id,
    );
  }

  /** countedAmount = số dư VAT tới occurredAt; deltaAmount = |expected - counted|; type theo hướng. */
  private async recompute(
    data: DeepPartial<VatDebtAdjustment>,
    manager: EntityManager,
  ): Promise<void> {
    if (!data.companyId || !data.occurredAt) return;
    const counted = await this.vatDebtSync.getBalanceAtDate(
      data.companyId,
      data.occurredAt,
      manager,
    );
    const expected = Number(data.expectedAmount || 0);
    data.countedAmount = counted;
    data.deltaAmount = Math.abs(expected - counted);
    data.type =
      expected >= counted ? TransactionTypeEnum.IN : TransactionTypeEnum.OUT;
  }
}
