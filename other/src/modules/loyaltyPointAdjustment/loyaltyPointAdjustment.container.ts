import { ContainerModule } from "inversify";
import { LoyaltyPointAdjustmentController } from "./loyaltyPointAdjustment.controller";
import { LoyaltyPointAdjustmentService } from "./loyaltyPointAdjustment.service";
import { LoyaltyPointAdjustmentRepository } from "./loyaltyPointAdjustment.repository";
import { LoyaltyPointAdjustmentRouter } from "./loyaltyPointAdjustment.route";
import { LOYALTY_POINT_ADJUSTMENT_TYPES } from "./loyaltyPointAdjustment.types";

const loyaltyPointAdjustmentModule = new ContainerModule((bind) => {
  bind<LoyaltyPointAdjustmentService>(
    LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentService,
  ).to(LoyaltyPointAdjustmentService);
  bind<LoyaltyPointAdjustmentController>(
    LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentController,
  ).to(LoyaltyPointAdjustmentController);
  bind<LoyaltyPointAdjustmentRepository>(
    LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentRepository,
  ).to(LoyaltyPointAdjustmentRepository);
  bind<LoyaltyPointAdjustmentRouter>(
    LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentRouter,
  ).to(LoyaltyPointAdjustmentRouter);
});

export { loyaltyPointAdjustmentModule };
