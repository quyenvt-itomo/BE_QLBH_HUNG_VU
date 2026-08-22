import { injectable, inject } from "inversify";
import { QuotationRequestLineService } from "./quotationRequestLine.service";
import { QUOTATION_REQUEST_LINE_TYPES } from "./quotationRequestLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { QuotationRequestLine } from "@/database/models/company/QuotationRequestLine";

@injectable()
export class QuotationRequestLineController extends BaseController<QuotationRequestLine> {
  protected service: QuotationRequestLineService;

  constructor(
    @inject(QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineService)
    service: QuotationRequestLineService,
  ) {
    super();
    this.service = service;
  }
}
