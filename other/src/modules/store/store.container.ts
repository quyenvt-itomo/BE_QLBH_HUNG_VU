import { ContainerModule } from "inversify";
import { StoreController } from "./store.controller";
import { StoreService } from "./store.service";
import { StoreRepository } from "./store.repository";
import { StoreRouter } from "./store.route";
import { STORE_TYPES } from "./store.types";

const storeModule = new ContainerModule((bind) => {
  bind<StoreService>(STORE_TYPES.StoreService).to(StoreService);
  bind<StoreController>(STORE_TYPES.StoreController).to(StoreController);
  bind<StoreRepository>(STORE_TYPES.StoreRepository).to(StoreRepository);
  bind<StoreRouter>(STORE_TYPES.StoreRouter).to(StoreRouter);
});

export { storeModule };
