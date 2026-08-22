import { ContainerModule } from "inversify";
import { WAREHOUSE_TRANSFER_TYPES } from "./warehouseTransfer.types";
import { WarehouseTransferController } from "./warehouseTransfer.controller";
import { WarehouseTransferService } from "./warehouseTransfer.service";
import { WarehouseTransferRepository } from "./warehouseTransfer.repository";
import { WarehouseTransferRouter } from "./warehouseTransfer.route";

export const warehouseTransferModule = new ContainerModule((bind) => {
  bind<WarehouseTransferController>(
    WAREHOUSE_TRANSFER_TYPES.WarehouseTransferController,
  ).to(WarehouseTransferController);
  bind<WarehouseTransferService>(
    WAREHOUSE_TRANSFER_TYPES.WarehouseTransferService,
  ).to(WarehouseTransferService);
  bind<WarehouseTransferRepository>(
    WAREHOUSE_TRANSFER_TYPES.WarehouseTransferRepository,
  ).to(WarehouseTransferRepository);
  bind<WarehouseTransferRouter>(
    WAREHOUSE_TRANSFER_TYPES.WarehouseTransferRouter,
  ).to(WarehouseTransferRouter);
});
