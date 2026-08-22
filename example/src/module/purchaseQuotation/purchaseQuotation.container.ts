import { ContainerModule } from "inversify";
import { PURCHASE_QUOTATION_TYPES } from "./purchaseQuotation.types";
import { PurchaseQuotationController } from "./purchaseQuotation.controller";
import { PurchaseQuotationService } from "./purchaseQuotation.service";
import { PurchaseQuotationRepository } from "./purchaseQuotation.repository";
import { PurchaseQuotationRouter } from "./purchaseQuotation.route";

export const purchaseQuotationModule = new ContainerModule((bind) => {
  bind<PurchaseQuotationController>(
    PURCHASE_QUOTATION_TYPES.PurchaseQuotationController,
  ).to(PurchaseQuotationController);
  bind<PurchaseQuotationService>(
    PURCHASE_QUOTATION_TYPES.PurchaseQuotationService,
  ).to(PurchaseQuotationService);
  bind<PurchaseQuotationRepository>(
    PURCHASE_QUOTATION_TYPES.PurchaseQuotationRepository,
  ).to(PurchaseQuotationRepository);
  bind<PurchaseQuotationRouter>(
    PURCHASE_QUOTATION_TYPES.PurchaseQuotationRouter,
  ).to(PurchaseQuotationRouter);
});
