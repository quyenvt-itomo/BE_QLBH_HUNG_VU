import { ContainerModule } from "inversify";
import { WAREHOUSE_TYPES } from "./warehouse.types";
import { WarehouseController } from "./warehouse.controller";
import { WarehouseService } from "./warehouse.service";
import { WarehouseRepository } from "./warehouse.repository";
import { WarehouseRouter } from "./warehouse.route";

export const warehouseModule = new ContainerModule((bind) => {
  bind<WarehouseController>(WAREHOUSE_TYPES.WarehouseController).to(
    WarehouseController,
  );
  bind<WarehouseService>(WAREHOUSE_TYPES.WarehouseService).to(WarehouseService);
  bind<WarehouseRepository>(WAREHOUSE_TYPES.WarehouseRepository).to(
    WarehouseRepository,
  );
  bind<WarehouseRouter>(WAREHOUSE_TYPES.WarehouseRouter).to(WarehouseRouter);
});
