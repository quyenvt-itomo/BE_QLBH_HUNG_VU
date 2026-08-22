import { ContainerModule } from "inversify";
import { PAYMENT_REQUEST_LINE_TYPES } from "./paymentRequestLine.types";
import { PaymentRequestLineController } from "./paymentRequestLine.controller";
import { PaymentRequestLineService } from "./paymentRequestLine.service";
import { PaymentRequestLineRepository } from "./paymentRequestLine.repository";
import { PaymentRequestLineRouter } from "./paymentRequestLine.route";

export const paymentRequestLineModule = new ContainerModule((bind) => {
  bind<PaymentRequestLineController>(
    PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineController,
  ).to(PaymentRequestLineController);
  bind<PaymentRequestLineService>(
    PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineService,
  ).to(PaymentRequestLineService);
  bind<PaymentRequestLineRepository>(
    PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineRepository,
  ).to(PaymentRequestLineRepository);
  bind<PaymentRequestLineRouter>(
    PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineRouter,
  ).to(PaymentRequestLineRouter);
});
