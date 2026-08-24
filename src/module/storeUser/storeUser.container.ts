import { createSimpleModule } from "../_shared/simple.bind";
import { StoreUserRepository } from "./storeUser.repository";
import { StoreUserService } from "./storeUser.service";
import { StoreUserController } from "./storeUser.controller";
import { StoreUserRouter } from "./storeUser.route";
import { STORE_USER_TYPES } from "./storeUser.types";

export const storeUserModule = createSimpleModule(
  STORE_USER_TYPES,
  StoreUserRepository,
  StoreUserService,
  StoreUserController,
  StoreUserRouter,
);
