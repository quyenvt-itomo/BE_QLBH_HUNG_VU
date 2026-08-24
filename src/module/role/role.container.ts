import { createSimpleModule } from "../_shared/simple.bind";
import { RoleRepository } from "./role.repository";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { RoleRouter } from "./role.route";
import { ROLE_TYPES } from "./role.types";

export const roleModule = createSimpleModule(
  ROLE_TYPES,
  RoleRepository,
  RoleService,
  RoleController,
  RoleRouter,
);
