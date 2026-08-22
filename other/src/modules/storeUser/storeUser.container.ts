import { ContainerModule } from "inversify";
import { StoreUserController } from "./storeUser.controller";
import { StoreUserService } from "./storeUser.service";
import { StoreUserRepository } from "./storeUser.repository";
import { StoreUserRouter } from "./storeUser.route";
import { STORE_USER_TYPES } from "./storeUser.types";

const storeUserModule = new ContainerModule((bind) => {
  bind<StoreUserService>(STORE_USER_TYPES.StoreUserService).to(
    StoreUserService,
  );
  bind<StoreUserController>(STORE_USER_TYPES.StoreUserController).to(
    StoreUserController,
  );
  bind<StoreUserRepository>(STORE_USER_TYPES.StoreUserRepository).to(
    StoreUserRepository,
  );
  bind<StoreUserRouter>(STORE_USER_TYPES.StoreUserRouter).to(StoreUserRouter);
});

export { storeUserModule };
