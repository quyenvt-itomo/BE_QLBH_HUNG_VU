import { injectable, inject } from "inversify";
import { PaymentTermService } from "./paymentTerm.service";
import { PAYMENT_TERM_TYPES } from "./paymentTerm.types";
import { BaseController } from "@/shared/base/BaseController";
import { PaymentTerm } from "@/database/models/company/PaymentTerm";

@injectable()
export class PaymentTermController extends BaseController<PaymentTerm> {
  protected service: PaymentTermService;

  constructor(
    @inject(PAYMENT_TERM_TYPES.PaymentTermService)
    service: PaymentTermService,
  ) {
    super();
    this.service = service;
  }
}
