import { injectable, inject } from "inversify";
import { PurchaseQuotationLineService } from "./purchaseQuotationLine.service";
import { PURCHASE_QUOTATION_LINE_TYPES } from "./purchaseQuotationLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { PurchaseQuotationLine } from "@/database/models/company/PurchaseQuotationLine";

@injectable()
export class PurchaseQuotationLineController extends BaseController<PurchaseQuotationLine> {
  protected service: PurchaseQuotationLineService;

  constructor(
    @inject(PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineService)
    service: PurchaseQuotationLineService,
  ) {
    super();
    this.service = service;
  }
}
