import { ContainerModule } from "inversify";
import { SystemRoleController } from "./systemRole.controller";
import { SystemRoleService } from "./systemRole.service";
import { SystemRoleRepository } from "./systemRole.repository";
import { SystemRoleRouter } from "./systemRole.route";
import { SYSTEM_ROLE_TYPES } from "./systemRole.types";

const systemRoleModule = new ContainerModule((bind) => {
  bind<SystemRoleService>(SYSTEM_ROLE_TYPES.SystemRoleService).to(
    SystemRoleService,
  );
  bind<SystemRoleController>(SYSTEM_ROLE_TYPES.SystemRoleController).to(
    SystemRoleController,
  );
  bind<SystemRoleRepository>(SYSTEM_ROLE_TYPES.SystemRoleRepository).to(
    SystemRoleRepository,
  );
  bind<SystemRoleRouter>(SYSTEM_ROLE_TYPES.SystemRoleRouter).to(
    SystemRoleRouter,
  );
});

export { systemRoleModule };
