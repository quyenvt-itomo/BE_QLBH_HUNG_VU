import { ContainerModule } from "inversify";
import { StoreUserRepository } from "./storeUser.repository";
import { StoreUserService } from "./storeUser.service";
import { StoreUserController } from "./storeUser.controller";
import { StoreUserRouter } from "./storeUser.route";
import { STORE_USER_TYPES } from "./storeUser.types";

export const storeUserModule = new ContainerModule((bind) => { bind(STORE_USER_TYPES.Repository).to(StoreUserRepository).inSingletonScope(); bind(STORE_USER_TYPES.Service).to(StoreUserService).inSingletonScope(); bind(STORE_USER_TYPES.Controller).to(StoreUserController).inSingletonScope(); bind(STORE_USER_TYPES.Router).to(StoreUserRouter).inSingletonScope(); });
