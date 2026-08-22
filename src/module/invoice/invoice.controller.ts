import { injectable, inject } from "inversify";
import { InvoiceService } from "./invoice.service";
import { INVOICE_TYPES } from "./invoice.types";
import { BaseController } from "@/shared/base/BaseController";
import { Invoice } from "@/database/models/company/Invoice";

@injectable()
export class InvoiceController extends BaseController<Invoice> {
  protected service: InvoiceService;

  constructor(@inject(INVOICE_TYPES.InvoiceService) service: InvoiceService) {
    super();
    this.service = service;
  }
}
