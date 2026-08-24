import { ContainerModule } from "inversify";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { InventoryAdjustmentRepository } from "./inventoryAdjustment.repository";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";
import { InventoryAdjustmentController } from "./inventoryAdjustment.controller";
import { InventoryAdjustmentRouter } from "./inventoryAdjustment.route";
import { INVENTORY_TYPES } from "../inventory/inventory.types";

export const inventoryAdjustmentModule = new ContainerModule((bind) => {
  bind(INVENTORY_ADJUSTMENT_TYPES.Repository)
    .to(InventoryAdjustmentRepository)
    .inSingletonScope();
  bind(INVENTORY_ADJUSTMENT_TYPES.Service)
    .toDynamicValue((context) => new InventoryAdjustmentService(
      context.container.get(INVENTORY_ADJUSTMENT_TYPES.Repository),
      context.container.get(INVENTORY_TYPES.InventoryRecalculateService),
    ))
    .inSingletonScope();
  bind(INVENTORY_ADJUSTMENT_TYPES.Controller)
    .toDynamicValue((context) => new InventoryAdjustmentController(
      context.container.get(INVENTORY_ADJUSTMENT_TYPES.Service),
    ))
    .inSingletonScope();
  bind(INVENTORY_ADJUSTMENT_TYPES.Router)
    .toDynamicValue((context) => new InventoryAdjustmentRouter(
      context.container.get(INVENTORY_ADJUSTMENT_TYPES.Controller),
    ))
    .inSingletonScope();
});
