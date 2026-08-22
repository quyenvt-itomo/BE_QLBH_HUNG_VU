import { injectable, inject } from "inversify";
import { QuotationLineService } from "./quotationLine.service";
import { QUOTATION_LINE_TYPES } from "./quotationLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { QuotationLine } from "@/database/models/company/QuotationLine";

@injectable()
export class QuotationLineController extends BaseController<QuotationLine> {
  protected service: QuotationLineService;

  constructor(
    @inject(QUOTATION_LINE_TYPES.QuotationLineService)
    service: QuotationLineService,
  ) {
    super();
    this.service = service;
  }
}
