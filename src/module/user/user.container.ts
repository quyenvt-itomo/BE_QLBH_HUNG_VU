import { ContainerModule } from "inversify";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserRouter } from "./user.route";
import { USER_TYPES } from "./user.types";

export const userModule = new ContainerModule((bind) => { bind(USER_TYPES.Repository).to(UserRepository).inSingletonScope(); bind(USER_TYPES.Service).to(UserService).inSingletonScope(); bind(USER_TYPES.Controller).to(UserController).inSingletonScope(); bind(USER_TYPES.Router).to(UserRouter).inSingletonScope(); });
