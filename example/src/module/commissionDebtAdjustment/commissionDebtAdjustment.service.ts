import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { CommissionDebtAdjustmentRepository } from "./commissionDebtAdjustment.repository";
import { COMMISSION_DEBT_ADJUSTMENT_TYPES } from "./commissionDebtAdjustment.types";
import { CommissionDebtAdjustment } from "@/database/models/company/CommissionDebtAdjustment";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import {
  PARTNER_CONTACT_TYPES,
  PartnerContactRepository,
} from "@/module/partnerContact";

@injectable()
export class CommissionDebtAdjustmentService extends BaseService<CommissionDebtAdjustment> {
  protected repository: CommissionDebtAdjustmentRepository;
  protected uniqueFields: (keyof CommissionDebtAdjustment)[] = ["code"];
  protected uniqueScope?: (keyof CommissionDebtAdjustment)[] = ["storeId"];
  protected searchableFields = ["code"];

  constructor(
    @inject(COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentRepository)
    repository: CommissionDebtAdjustmentRepository,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<CommissionDebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerContactId) {
      data.partnerContactSnapshot =
        await this.partnerContactRepository.getSnapshot(
          data.partnerContactId,
          manager,
        );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<CommissionDebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerContactId !== undefined) {
      data.partnerContactSnapshot = data.partnerContactId
        ? await this.partnerContactRepository.getSnapshot(
            data.partnerContactId,
            manager,
          )
        : null;
    }
  }
}
