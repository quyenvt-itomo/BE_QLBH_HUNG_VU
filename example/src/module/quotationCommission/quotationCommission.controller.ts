import { injectable, inject } from "inversify";
import { QuotationCommissionService } from "./quotationCommission.service";
import { QUOTATION_COMMISSION_TYPES } from "./quotationCommission.types";
import { BaseController } from "@/shared/base/BaseController";
import { QuotationCommission } from "@/database/models/company/QuotationCommission";

@injectable()
export class QuotationCommissionController extends BaseController<QuotationCommission> {
  protected service: QuotationCommissionService;

  constructor(
    @inject(QUOTATION_COMMISSION_TYPES.QuotationCommissionService)
    service: QuotationCommissionService,
  ) {
    super();
    this.service = service;
  }
}
