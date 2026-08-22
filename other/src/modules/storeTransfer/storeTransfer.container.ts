import { ContainerModule } from "inversify";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { StoreTransferService } from "./storeTransfer.service";
import { StoreTransferRepository } from "./storeTransfer.repository";
import { StoreTransferController } from "./storeTransfer.controller";
import { StoreTransferRouter } from "./storeTransfer.route";

export const storeTransferModule = new ContainerModule((bind) => {
  bind<StoreTransferService>(STORE_TRANSFER_TYPES.StoreTransferService).to(
    StoreTransferService,
  );
  bind<StoreTransferController>(
    STORE_TRANSFER_TYPES.StoreTransferController,
  ).to(StoreTransferController);
  bind<StoreTransferRepository>(
    STORE_TRANSFER_TYPES.StoreTransferRepository,
  ).to(StoreTransferRepository);
  bind<StoreTransferRouter>(STORE_TRANSFER_TYPES.StoreTransferRouter).to(
    StoreTransferRouter,
  );
});
