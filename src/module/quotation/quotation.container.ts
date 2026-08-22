import { ContainerModule } from "inversify";
import { QUOTATION_TYPES } from "./quotation.types";
import { QuotationController } from "./quotation.controller";
import { QuotationService } from "./quotation.service";
import { QuotationRepository } from "./quotation.repository";
import { QuotationRouter } from "./quotation.route";

export const quotationModule = new ContainerModule((bind) => {
  bind<QuotationController>(QUOTATION_TYPES.QuotationController).to(
    QuotationController,
  );
  bind<QuotationService>(QUOTATION_TYPES.QuotationService).to(QuotationService);
  bind<QuotationRepository>(QUOTATION_TYPES.QuotationRepository).to(
    QuotationRepository,
  );
  bind<QuotationRouter>(QUOTATION_TYPES.QuotationRouter).to(QuotationRouter);
});
