import { ContainerModule } from "inversify";
import { LoyaltyPointService } from "./loyaltyPoint.service";
import { LoyaltyPointTransactionRepository } from "./loyaltyPoint.repository";
import { LoyaltyPointController } from "./loyaltyPoint.controller";
import { LoyaltyPointRouter } from "./loyaltyPoint.route";
import { LoyaltyPointRecalculateService } from "./loyaltyPointRecalculate.service";
import { LOYALTY_POINT_TYPES } from "./loyaltyPoint.types";

const loyaltyPointModule = new ContainerModule((bind) => {
  bind<LoyaltyPointService>(LOYALTY_POINT_TYPES.LoyaltyPointService).to(
    LoyaltyPointService,
  );
  bind<LoyaltyPointTransactionRepository>(
    LOYALTY_POINT_TYPES.LoyaltyPointRepository,
  ).to(LoyaltyPointTransactionRepository);
  bind<LoyaltyPointController>(LOYALTY_POINT_TYPES.LoyaltyPointController).to(
    LoyaltyPointController,
  );
  bind<LoyaltyPointRouter>(LOYALTY_POINT_TYPES.LoyaltyPointRouter).to(
    LoyaltyPointRouter,
  );
  bind<LoyaltyPointRecalculateService>(
    LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService,
  ).to(LoyaltyPointRecalculateService);
});

export { loyaltyPointModule };
