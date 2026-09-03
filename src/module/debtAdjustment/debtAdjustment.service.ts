import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";
import { DebtAdjustmentRepository } from "./debtAdjustment.repository";
import { DEBT_ADJUSTMENT_TYPES } from "./debtAdjustment.types";
@injectable()
export class DebtAdjustmentService extends BaseService<DebtAdjustment> {
  protected repository: DebtAdjustmentRepository;
  protected uniqueFields: (keyof DebtAdjustment)[] = ["code"];
  constructor(
    @inject(DEBT_ADJUSTMENT_TYPES.Repository)
    repository: DebtAdjustmentRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
  ) {
    super();
    this.repository = repository;
  }
  async validateBeforeCreate(
    data: DeepPartial<DebtAdjustment>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (!data.code) data.code = await generateCode("debtadjustment");
    data.deltaAmount =
      Number(data.countedAmount || 0) - Number(data.expectedAmount || 0);
    await this.partnerRepository.attachInfo(data, manager);
    if (data.partnerId && !data.partnerSnapshot)
      throw new Error("partner.not_found");
  }
}
