import { ContainerModule } from "inversify";
import { WAREHOUSE_TRANSFER_LINE_TYPES } from "./warehouseTransferLine.types";
import { WarehouseTransferLineController } from "./warehouseTransferLine.controller";
import { WarehouseTransferLineService } from "./warehouseTransferLine.service";
import { WarehouseTransferLineRepository } from "./warehouseTransferLine.repository";
import { WarehouseTransferLineRouter } from "./warehouseTransferLine.route";

export const warehouseTransferLineModule = new ContainerModule((bind) => {
  bind<WarehouseTransferLineController>(
    WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineController,
  ).to(WarehouseTransferLineController);
  bind<WarehouseTransferLineService>(
    WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineService,
  ).to(WarehouseTransferLineService);
  bind<WarehouseTransferLineRepository>(
    WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineRepository,
  ).to(WarehouseTransferLineRepository);
  bind<WarehouseTransferLineRouter>(
    WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineRouter,
  ).to(WarehouseTransferLineRouter);
});
