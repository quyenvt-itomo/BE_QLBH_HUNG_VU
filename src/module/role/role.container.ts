import { ContainerModule } from "inversify";
import { ROLE_TYPES } from "./role.types";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { RoleRepository } from "./role.repository";
import { RoleRouter } from "./role.route";

const roleModule = new ContainerModule((bind) => {
  bind<RoleController>(ROLE_TYPES.RoleController).to(RoleController);
  bind<RoleService>(ROLE_TYPES.RoleService).to(RoleService);
  bind<RoleRepository>(ROLE_TYPES.RoleRepository).to(RoleRepository);
  bind<RoleRouter>(ROLE_TYPES.RoleRouter).to(RoleRouter);
});

export { roleModule };
