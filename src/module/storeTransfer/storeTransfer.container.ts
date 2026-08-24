import { ContainerModule } from "inversify";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { StoreTransferRepository } from "./storeTransfer.repository";
import { StoreTransferService } from "./storeTransfer.service";
import { StoreTransferController } from "./storeTransfer.controller";
import { StoreTransferRouter } from "./storeTransfer.route";
import { INVENTORY_TYPES } from "../inventory/inventory.types";

export const storeTransferModule = new ContainerModule((bind) => {
  bind(STORE_TRANSFER_TYPES.Repository).to(StoreTransferRepository).inSingletonScope();
  bind(STORE_TRANSFER_TYPES.Service)
    .toDynamicValue((context) => new StoreTransferService(
      context.container.get(STORE_TRANSFER_TYPES.Repository),
      context.container.get(INVENTORY_TYPES.InventoryRecalculateService),
    ))
    .inSingletonScope();
  bind(STORE_TRANSFER_TYPES.Controller)
    .toDynamicValue((context) => new StoreTransferController(
      context.container.get(STORE_TRANSFER_TYPES.Service),
    ))
    .inSingletonScope();
  bind(STORE_TRANSFER_TYPES.Router)
    .toDynamicValue((context) => new StoreTransferRouter(
      context.container.get(STORE_TRANSFER_TYPES.Controller),
    ))
    .inSingletonScope();
});
