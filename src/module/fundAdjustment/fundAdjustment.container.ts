import { ContainerModule } from "inversify";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { FundAdjustmentController } from "./fundAdjustment.controller";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
import { FundAdjustmentRouter } from "./fundAdjustment.route";

export const fundAdjustmentModule = new ContainerModule((bind) => {
  bind<FundAdjustmentController>(
    FUND_ADJUSTMENT_TYPES.FundAdjustmentController,
  ).to(FundAdjustmentController);
  bind<FundAdjustmentService>(FUND_ADJUSTMENT_TYPES.FundAdjustmentService).to(
    FundAdjustmentService,
  );
  bind<FundAdjustmentRepository>(
    FUND_ADJUSTMENT_TYPES.FundAdjustmentRepository,
  ).to(FundAdjustmentRepository);
  bind<FundAdjustmentRouter>(FUND_ADJUSTMENT_TYPES.FundAdjustmentRouter).to(
    FundAdjustmentRouter,
  );
});
