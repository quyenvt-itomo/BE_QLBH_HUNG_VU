import { ContainerModule } from "inversify";
import { PAYMENT_REQUEST_TYPES } from "./paymentRequest.types";
import { PaymentRequestController } from "./paymentRequest.controller";
import { PaymentRequestService } from "./paymentRequest.service";
import { PaymentRequestRepository } from "./paymentRequest.repository";
import { PaymentRequestRouter } from "./paymentRequest.route";

export const paymentRequestModule = new ContainerModule((bind) => {
  bind<PaymentRequestController>(
    PAYMENT_REQUEST_TYPES.PaymentRequestController,
  ).to(PaymentRequestController);
  bind<PaymentRequestService>(PAYMENT_REQUEST_TYPES.PaymentRequestService).to(
    PaymentRequestService,
  );
  bind<PaymentRequestRepository>(
    PAYMENT_REQUEST_TYPES.PaymentRequestRepository,
  ).to(PaymentRequestRepository);
  bind<PaymentRequestRouter>(PAYMENT_REQUEST_TYPES.PaymentRequestRouter).to(
    PaymentRequestRouter,
  );
});
