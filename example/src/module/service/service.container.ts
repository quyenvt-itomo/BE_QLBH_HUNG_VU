import { ContainerModule } from "inversify";
import { SERVICE_TYPES } from "./service.types";
import { ServiceController } from "./service.controller";
import { ServiceService } from "./service.service";
import { ServiceRepository } from "./service.repository";
import { ServiceRouter } from "./service.route";

export const serviceModule = new ContainerModule((bind) => {
  bind<ServiceController>(SERVICE_TYPES.ServiceController).to(
    ServiceController,
  );
  bind<ServiceService>(SERVICE_TYPES.ServiceService).to(ServiceService);
  bind<ServiceRepository>(SERVICE_TYPES.ServiceRepository).to(
    ServiceRepository,
  );
  bind<ServiceRouter>(SERVICE_TYPES.ServiceRouter).to(ServiceRouter);
});
