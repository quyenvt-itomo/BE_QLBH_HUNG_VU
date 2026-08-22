import { ContainerModule } from "inversify";
import { InventoryAdjustmentLineService } from "./inventoryAdjustmentLine.service";
import { InventoryAdjustmentLineRepository } from "./inventoryAdjustmentLine.repository";
import { InventoryAdjustmentLineController } from "./inventoryAdjustmentLine.controller";
import { InventoryAdjustmentLineRouter } from "./inventoryAdjustmentLine.route";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";

const inventoryAdjustmentLineModule = new ContainerModule((bind) => {
  bind<InventoryAdjustmentLineService>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineService,
  ).to(InventoryAdjustmentLineService);
  bind<InventoryAdjustmentLineRepository>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRepository,
  ).to(InventoryAdjustmentLineRepository);
  bind<InventoryAdjustmentLineController>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineController,
  ).to(InventoryAdjustmentLineController);
  bind<InventoryAdjustmentLineRouter>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRouter,
  ).to(InventoryAdjustmentLineRouter);
});

export { inventoryAdjustmentLineModule };
