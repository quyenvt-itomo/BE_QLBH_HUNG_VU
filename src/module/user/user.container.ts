import { createSimpleModule } from "../_shared/simple.bind";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserRouter } from "./user.route";
import { USER_TYPES } from "./user.types";

export const userModule = createSimpleModule(
  USER_TYPES,
  UserRepository,
  UserService,
  UserController,
  UserRouter,
);
