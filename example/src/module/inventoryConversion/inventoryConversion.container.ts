import { ContainerModule } from "inversify";
import { INVENTORY_CONVERSION_TYPES } from "./inventoryConversion.types";
import { InventoryConversionController } from "./inventoryConversion.controller";
import { InventoryConversionService } from "./inventoryConversion.service";
import { InventoryConversionRepository } from "./inventoryConversion.repository";
import { InventoryConversionRouter } from "./inventoryConversion.route";

export const inventoryConversionModule = new ContainerModule((bind) => {
  bind<InventoryConversionController>(
    INVENTORY_CONVERSION_TYPES.InventoryConversionController,
  ).to(InventoryConversionController);
  bind<InventoryConversionService>(
    INVENTORY_CONVERSION_TYPES.InventoryConversionService,
  ).to(InventoryConversionService);
  bind<InventoryConversionRepository>(
    INVENTORY_CONVERSION_TYPES.InventoryConversionRepository,
  ).to(InventoryConversionRepository);
  bind<InventoryConversionRouter>(
    INVENTORY_CONVERSION_TYPES.InventoryConversionRouter,
  ).to(InventoryConversionRouter);
});
