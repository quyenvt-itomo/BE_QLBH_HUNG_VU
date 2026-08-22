import { injectable, inject } from "inversify";
import { StockDocumentLineService } from "./stockDocumentLine.service";
import { STOCK_DOCUMENT_LINE_TYPES } from "./stockDocumentLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";

@injectable()
export class StockDocumentLineController extends BaseController<StockDocumentLine> {
  protected service: StockDocumentLineService;

  constructor(
    @inject(STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineService)
    service: StockDocumentLineService,
  ) {
    super();
    this.service = service;
  }
}
