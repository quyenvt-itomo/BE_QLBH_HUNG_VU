import { injectable, inject } from "inversify";
import { PaymentRequestLineService } from "./paymentRequestLine.service";
import { PAYMENT_REQUEST_LINE_TYPES } from "./paymentRequestLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { PaymentRequestLine } from "@/database/models/company/PaymentRequestLine";

@injectable()
export class PaymentRequestLineController extends BaseController<PaymentRequestLine> {
  protected service: PaymentRequestLineService;

  constructor(
    @inject(PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineService)
    service: PaymentRequestLineService,
  ) {
    super();
    this.service = service;
  }
}
