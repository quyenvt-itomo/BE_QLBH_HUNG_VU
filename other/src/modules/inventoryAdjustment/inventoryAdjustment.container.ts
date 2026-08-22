import { ContainerModule } from "inversify";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";
import { InventoryAdjustmentRepository } from "./inventoryAdjustment.repository";
import { InventoryAdjustmentController } from "./inventoryAdjustment.controller";
import { InventoryAdjustmentRouter } from "./inventoryAdjustment.route";

export const inventoryAdjustmentModule = new ContainerModule((bind) => {
  bind<InventoryAdjustmentService>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentService,
  ).to(InventoryAdjustmentService);
  bind<InventoryAdjustmentController>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentController,
  ).to(InventoryAdjustmentController);
  bind<InventoryAdjustmentRepository>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository,
  ).to(InventoryAdjustmentRepository);
  bind<InventoryAdjustmentRouter>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRouter,
  ).to(InventoryAdjustmentRouter);
});
