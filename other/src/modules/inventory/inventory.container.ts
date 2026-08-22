import { ContainerModule } from "inversify";
import { INVENTORY_TYPES } from "./inventory.types";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { InventoryRecalculateService } from "./inventoryRecalculate.service";
import { InventoryRouter } from "./inventory.route";
import { StockMetadataHelper } from "./stockMetadata.helper";

export const inventoryModule = new ContainerModule((bind) => {
  bind<InventoryService>(INVENTORY_TYPES.InventoryService).to(InventoryService);
  bind<InventoryController>(INVENTORY_TYPES.InventoryController).to(
    InventoryController,
  );
  bind<InventoryRecalculateService>(
    INVENTORY_TYPES.InventoryRecalculateService,
  ).to(InventoryRecalculateService);
  bind<StockMetadataHelper>(INVENTORY_TYPES.StockMetadataHelper).to(
    StockMetadataHelper,
  );
  bind<InventoryRouter>(INVENTORY_TYPES.InventoryRouter).to(InventoryRouter);
});
