import { ContainerModule } from "inversify";
import { StoreTransferLineService } from "./storeTransferLine.service";
import { StoreTransferLineRepository } from "./storeTransferLine.repository";
import { StoreTransferLineController } from "./storeTransferLine.controller";
import { StoreTransferLineRouter } from "./storeTransferLine.route";
import { STORE_TRANSFER_LINE_TYPES } from "./storeTransferLine.types";

const storeTransferLineModule = new ContainerModule((bind) => {
  bind<StoreTransferLineService>(
    STORE_TRANSFER_LINE_TYPES.StoreTransferLineService,
  ).to(StoreTransferLineService);
  bind<StoreTransferLineRepository>(
    STORE_TRANSFER_LINE_TYPES.StoreTransferLineRepository,
  ).to(StoreTransferLineRepository);
  bind<StoreTransferLineController>(
    STORE_TRANSFER_LINE_TYPES.StoreTransferLineController,
  ).to(StoreTransferLineController);
  bind<StoreTransferLineRouter>(
    STORE_TRANSFER_LINE_TYPES.StoreTransferLineRouter,
  ).to(StoreTransferLineRouter);
});

export { storeTransferLineModule };
