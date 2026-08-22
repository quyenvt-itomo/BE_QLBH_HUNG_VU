import { ContainerModule } from "inversify";
import { QUOTATION_REQUEST_LINE_TYPES } from "./quotationRequestLine.types";
import { QuotationRequestLineController } from "./quotationRequestLine.controller";
import { QuotationRequestLineService } from "./quotationRequestLine.service";
import { QuotationRequestLineRepository } from "./quotationRequestLine.repository";
import { QuotationRequestLineRouter } from "./quotationRequestLine.route";

export const quotationRequestLineModule = new ContainerModule((bind) => {
  bind<QuotationRequestLineController>(
    QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineController,
  ).to(QuotationRequestLineController);
  bind<QuotationRequestLineService>(
    QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineService,
  ).to(QuotationRequestLineService);
  bind<QuotationRequestLineRepository>(
    QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineRepository,
  ).to(QuotationRequestLineRepository);
  bind<QuotationRequestLineRouter>(
    QUOTATION_REQUEST_LINE_TYPES.QuotationRequestLineRouter,
  ).to(QuotationRequestLineRouter);
});
