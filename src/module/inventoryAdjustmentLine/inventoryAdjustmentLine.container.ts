import { ContainerModule } from "inversify";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";
import { InventoryAdjustmentLineController } from "./inventoryAdjustmentLine.controller";
import { InventoryAdjustmentLineService } from "./inventoryAdjustmentLine.service";
import { InventoryAdjustmentLineRepository } from "./inventoryAdjustmentLine.repository";
import { InventoryAdjustmentLineRouter } from "./inventoryAdjustmentLine.route";

export const inventoryAdjustmentLineModule = new ContainerModule((bind) => {
  bind<InventoryAdjustmentLineController>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineController,
  ).to(InventoryAdjustmentLineController);
  bind<InventoryAdjustmentLineService>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineService,
  ).to(InventoryAdjustmentLineService);
  bind<InventoryAdjustmentLineRepository>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRepository,
  ).to(InventoryAdjustmentLineRepository);
  bind<InventoryAdjustmentLineRouter>(
    INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRouter,
  ).to(InventoryAdjustmentLineRouter);
});
