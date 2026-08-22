import { ContainerModule } from "inversify";
import { PURCHASE_QUOTATION_LINE_TYPES } from "./purchaseQuotationLine.types";
import { PurchaseQuotationLineController } from "./purchaseQuotationLine.controller";
import { PurchaseQuotationLineService } from "./purchaseQuotationLine.service";
import { PurchaseQuotationLineRepository } from "./purchaseQuotationLine.repository";
import { PurchaseQuotationLineRouter } from "./purchaseQuotationLine.route";

export const purchaseQuotationLineModule = new ContainerModule((bind) => {
  bind<PurchaseQuotationLineController>(
    PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineController,
  ).to(PurchaseQuotationLineController);
  bind<PurchaseQuotationLineService>(
    PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineService,
  ).to(PurchaseQuotationLineService);
  bind<PurchaseQuotationLineRepository>(
    PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineRepository,
  ).to(PurchaseQuotationLineRepository);
  bind<PurchaseQuotationLineRouter>(
    PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineRouter,
  ).to(PurchaseQuotationLineRouter);
});
