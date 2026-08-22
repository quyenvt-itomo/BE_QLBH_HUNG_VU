import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { QuotationCommissionRepository } from "./quotationCommission.repository";
import { QUOTATION_COMMISSION_TYPES } from "./quotationCommission.types";
import { QuotationCommission } from "@/database/models/company/QuotationCommission";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import {
  PARTNER_CONTACT_TYPES,
  PartnerContactRepository,
} from "@/module/partnerContact";

@injectable()
export class QuotationCommissionService extends BaseService<QuotationCommission> {
  protected repository: QuotationCommissionRepository;
  protected searchableFields = [];

  constructor(
    @inject(QUOTATION_COMMISSION_TYPES.QuotationCommissionRepository)
    repository: QuotationCommissionRepository,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<QuotationCommission>,
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
    data: DeepPartial<QuotationCommission>,
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
