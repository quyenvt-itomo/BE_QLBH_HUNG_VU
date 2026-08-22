import { ContainerModule } from "inversify";
import { PURCHASE_TYPES } from "./purchase.types";
import { PurchaseController } from "./purchase.controller";
import { PurchaseService } from "./purchase.service";
import { PurchaseRepository } from "./purchase.repository";
import { PurchaseRouter } from "./purchase.route";

export const purchaseModule = new ContainerModule((bind) => {
  bind<PurchaseController>(PURCHASE_TYPES.PurchaseController).to(
    PurchaseController,
  );
  bind<PurchaseService>(PURCHASE_TYPES.PurchaseService).to(PurchaseService);
  bind<PurchaseRepository>(PURCHASE_TYPES.PurchaseRepository).to(
    PurchaseRepository,
  );
  bind<PurchaseRouter>(PURCHASE_TYPES.PurchaseRouter).to(PurchaseRouter);
});
