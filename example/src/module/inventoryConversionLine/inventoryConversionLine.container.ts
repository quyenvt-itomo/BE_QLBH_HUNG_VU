import { ContainerModule } from "inversify";
import { INVENTORY_CONVERSION_LINE_TYPES } from "./inventoryConversionLine.types";
import { InventoryConversionLineController } from "./inventoryConversionLine.controller";
import { InventoryConversionLineService } from "./inventoryConversionLine.service";
import { InventoryConversionLineRepository } from "./inventoryConversionLine.repository";
import { InventoryConversionLineRouter } from "./inventoryConversionLine.route";

export const inventoryConversionLineModule = new ContainerModule((bind) => {
  bind<InventoryConversionLineController>(
    INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineController,
  ).to(InventoryConversionLineController);
  bind<InventoryConversionLineService>(
    INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineService,
  ).to(InventoryConversionLineService);
  bind<InventoryConversionLineRepository>(
    INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineRepository,
  ).to(InventoryConversionLineRepository);
  bind<InventoryConversionLineRouter>(
    INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineRouter,
  ).to(InventoryConversionLineRouter);
});
