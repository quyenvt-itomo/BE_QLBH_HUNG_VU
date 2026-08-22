import { ContainerModule } from "inversify";
import { QUOTATION_REQUEST_TYPES } from "./quotationRequest.types";
import { QuotationRequestController } from "./quotationRequest.controller";
import { QuotationRequestService } from "./quotationRequest.service";
import { QuotationRequestRepository } from "./quotationRequest.repository";
import { QuotationRequestRouter } from "./quotationRequest.route";

export const quotationRequestModule = new ContainerModule((bind) => {
  bind<QuotationRequestController>(
    QUOTATION_REQUEST_TYPES.QuotationRequestController,
  ).to(QuotationRequestController);
  bind<QuotationRequestService>(
    QUOTATION_REQUEST_TYPES.QuotationRequestService,
  ).to(QuotationRequestService);
  bind<QuotationRequestRepository>(
    QUOTATION_REQUEST_TYPES.QuotationRequestRepository,
  ).to(QuotationRequestRepository);
  bind<QuotationRequestRouter>(
    QUOTATION_REQUEST_TYPES.QuotationRequestRouter,
  ).to(QuotationRequestRouter);
});
