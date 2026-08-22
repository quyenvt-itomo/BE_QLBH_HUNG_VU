import { ContainerModule } from "inversify";
import { PURCHASE_LINE_TYPES } from "./purchaseLine.types";
import { PurchaseLineController } from "./purchaseLine.controller";
import { PurchaseLineService } from "./purchaseLine.service";
import { PurchaseLineRepository } from "./purchaseLine.repository";
import { PurchaseLineRouter } from "./purchaseLine.route";

export const purchaseLineModule = new ContainerModule((bind) => {
  bind<PurchaseLineController>(PURCHASE_LINE_TYPES.PurchaseLineController).to(
    PurchaseLineController,
  );
  bind<PurchaseLineService>(PURCHASE_LINE_TYPES.PurchaseLineService).to(
    PurchaseLineService,
  );
  bind<PurchaseLineRepository>(PURCHASE_LINE_TYPES.PurchaseLineRepository).to(
    PurchaseLineRepository,
  );
  bind<PurchaseLineRouter>(PURCHASE_LINE_TYPES.PurchaseLineRouter).to(
    PurchaseLineRouter,
  );
});
