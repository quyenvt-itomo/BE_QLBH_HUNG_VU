import { ContainerModule } from "inversify";
import { PAYMENT_TERM_TYPES } from "./paymentTerm.types";
import { PaymentTermController } from "./paymentTerm.controller";
import { PaymentTermService } from "./paymentTerm.service";
import { PaymentTermRepository } from "./paymentTerm.repository";
import { PaymentTermRouter } from "./paymentTerm.route";

export const paymentTermModule = new ContainerModule((bind) => {
  bind<PaymentTermController>(PAYMENT_TERM_TYPES.PaymentTermController).to(
    PaymentTermController,
  );
  bind<PaymentTermService>(PAYMENT_TERM_TYPES.PaymentTermService).to(
    PaymentTermService,
  );
  bind<PaymentTermRepository>(PAYMENT_TERM_TYPES.PaymentTermRepository).to(
    PaymentTermRepository,
  );
  bind<PaymentTermRouter>(PAYMENT_TERM_TYPES.PaymentTermRouter).to(
    PaymentTermRouter,
  );
});
