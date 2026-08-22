import { ContainerModule } from "inversify";
import { QUOTATION_LINE_TYPES } from "./quotationLine.types";
import { QuotationLineController } from "./quotationLine.controller";
import { QuotationLineService } from "./quotationLine.service";
import { QuotationLineRepository } from "./quotationLine.repository";
import { QuotationLineRouter } from "./quotationLine.route";

export const quotationLineModule = new ContainerModule((bind) => {
  bind<QuotationLineController>(
    QUOTATION_LINE_TYPES.QuotationLineController,
  ).to(QuotationLineController);
  bind<QuotationLineService>(QUOTATION_LINE_TYPES.QuotationLineService).to(
    QuotationLineService,
  );
  bind<QuotationLineRepository>(
    QUOTATION_LINE_TYPES.QuotationLineRepository,
  ).to(QuotationLineRepository);
  bind<QuotationLineRouter>(QUOTATION_LINE_TYPES.QuotationLineRouter).to(
    QuotationLineRouter,
  );
});
