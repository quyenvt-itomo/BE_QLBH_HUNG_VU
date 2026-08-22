import { injectable, inject } from "inversify";
import { PartnerDebtAdjustmentService } from "./partnerDebtAdjustment.service";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "./partnerDebtAdjustment.types";
import { BaseController } from "@/shared/base/BaseController";
import { PartnerDebtAdjustment } from "@/database/models/company/PartnerDebtAdjustment";

@injectable()
export class PartnerDebtAdjustmentController extends BaseController<PartnerDebtAdjustment> {
  protected service: PartnerDebtAdjustmentService;

  constructor(
    @inject(PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentService)
    service: PartnerDebtAdjustmentService,
  ) {
    super();
    this.service = service;
  }
}
