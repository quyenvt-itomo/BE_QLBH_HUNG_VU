import { injectable, inject } from "inversify";
import { PartnerDebtOffsetService } from "./partnerDebtOffset.service";
import { PARTNER_DEBT_OFFSET_TYPES } from "./partnerDebtOffset.types";
import { BaseController } from "@/shared/base/BaseController";
import { PartnerDebtOffset } from "@/database/models/PartnerDebtOffset";

@injectable()
export class PartnerDebtOffsetController extends BaseController<PartnerDebtOffset> {
  protected service: PartnerDebtOffsetService;

  constructor(
    @inject(PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetService)
    service: PartnerDebtOffsetService,
  ) {
    super();
    this.service = service;
  }
}
