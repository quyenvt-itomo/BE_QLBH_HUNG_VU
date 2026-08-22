import { ContainerModule } from "inversify";
import { PRODUCTION_TYPES } from "./production.types";
import { ProductionController } from "./production.controller";
import { ProductionService } from "./production.service";
import { ProductionRepository } from "./production.repository";
import { ProductionRouter } from "./production.route";

export const productionModule = new ContainerModule((bind) => {
  bind<ProductionController>(PRODUCTION_TYPES.ProductionController).to(
    ProductionController,
  );
  bind<ProductionService>(PRODUCTION_TYPES.ProductionService).to(
    ProductionService,
  );
  bind<ProductionRepository>(PRODUCTION_TYPES.ProductionRepository).to(
    ProductionRepository,
  );
  bind<ProductionRouter>(PRODUCTION_TYPES.ProductionRouter).to(
    ProductionRouter,
  );
});
