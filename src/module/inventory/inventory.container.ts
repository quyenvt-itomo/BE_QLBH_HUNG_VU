import { ContainerModule } from "inversify";
import { INVENTORY_TYPES } from "./inventory.types";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { InventoryRecalculateService } from "./inventoryRecalculate.service";
import { StockMetadataHelper } from "./stockMetadata.helper";

export const inventoryModule = new ContainerModule((bind) => {
  bind(INVENTORY_TYPES.StockMetadataHelper).to(StockMetadataHelper).inSingletonScope();
  bind(INVENTORY_TYPES.InventoryRecalculateService)
    .to(InventoryRecalculateService)
    .inSingletonScope();
  bind(INVENTORY_TYPES.InventoryService).to(InventoryService).inSingletonScope();
  bind(INVENTORY_TYPES.InventoryController).to(InventoryController).inSingletonScope();
});
