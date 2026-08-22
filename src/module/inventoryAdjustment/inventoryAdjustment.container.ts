import { ContainerModule } from "inversify";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { InventoryAdjustmentController } from "./inventoryAdjustment.controller";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";
import { InventoryAdjustmentRepository } from "./inventoryAdjustment.repository";
import { InventoryAdjustmentRouter } from "./inventoryAdjustment.route";

export const inventoryAdjustmentModule = new ContainerModule((bind) => {
  bind<InventoryAdjustmentController>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentController,
  ).to(InventoryAdjustmentController);
  bind<InventoryAdjustmentService>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentService,
  ).to(InventoryAdjustmentService);
  bind<InventoryAdjustmentRepository>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository,
  ).to(InventoryAdjustmentRepository);
  bind<InventoryAdjustmentRouter>(
    INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRouter,
  ).to(InventoryAdjustmentRouter);
});
