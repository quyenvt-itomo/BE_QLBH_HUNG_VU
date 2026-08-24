import { ContainerModule } from "inversify";
import { RoleRepository } from "./role.repository";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { RoleRouter } from "./role.route";
import { ROLE_TYPES } from "./role.types";

export const roleModule = new ContainerModule((bind) => { bind(ROLE_TYPES.Repository).to(RoleRepository).inSingletonScope(); bind(ROLE_TYPES.Service).to(RoleService).inSingletonScope(); bind(ROLE_TYPES.Controller).to(RoleController).inSingletonScope(); bind(ROLE_TYPES.Router).to(RoleRouter).inSingletonScope(); });
