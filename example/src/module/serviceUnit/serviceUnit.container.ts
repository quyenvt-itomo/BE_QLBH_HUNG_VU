import { ContainerModule } from "inversify";
import { SERVICE_UNIT_TYPES } from "./serviceUnit.types";
import { ServiceUnitController } from "./serviceUnit.controller";
import { ServiceUnitService } from "./serviceUnit.service";
import { ServiceUnitRepository } from "./serviceUnit.repository";
import { ServiceUnitRouter } from "./serviceUnit.route";

export const serviceUnitModule = new ContainerModule((bind) => {
  bind<ServiceUnitController>(SERVICE_UNIT_TYPES.ServiceUnitController).to(
    ServiceUnitController,
  );
  bind<ServiceUnitService>(SERVICE_UNIT_TYPES.ServiceUnitService).to(
    ServiceUnitService,
  );
  bind<ServiceUnitRepository>(SERVICE_UNIT_TYPES.ServiceUnitRepository).to(
    ServiceUnitRepository,
  );
  bind<ServiceUnitRouter>(SERVICE_UNIT_TYPES.ServiceUnitRouter).to(
    ServiceUnitRouter,
  );
});
