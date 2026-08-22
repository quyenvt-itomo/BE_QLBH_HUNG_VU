import { ContainerModule } from "inversify";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { OrganizationRepository } from "./organization.repository";
import { OrganizationRouter } from "./organization.route";
import { ORGANIZATION_TYPES } from "./organization.types";

const organizationModule = new ContainerModule((bind) => {
  bind<OrganizationService>(ORGANIZATION_TYPES.OrganizationService).to(
    OrganizationService,
  );
  bind<OrganizationController>(ORGANIZATION_TYPES.OrganizationController).to(
    OrganizationController,
  );
  bind<OrganizationRepository>(ORGANIZATION_TYPES.OrganizationRepository).to(
    OrganizationRepository,
  );
  bind<OrganizationRouter>(ORGANIZATION_TYPES.OrganizationRouter).to(
    OrganizationRouter,
  );
});

export { organizationModule };
