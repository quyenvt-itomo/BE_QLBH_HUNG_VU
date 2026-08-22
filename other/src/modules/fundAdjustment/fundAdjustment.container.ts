import { ContainerModule } from "inversify";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FundAdjustmentController } from "./fundAdjustment.controller";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { FundAdjustmentRouter } from "./fundAdjustment.route";

const fundAdjustmentModule = new ContainerModule((bind) => {
  bind<FundAdjustmentService>(FUND_ADJUSTMENT_TYPES.FundAdjustmentService).to(
    FundAdjustmentService,
  );
  bind<FundAdjustmentController>(
    FUND_ADJUSTMENT_TYPES.FundAdjustmentController,
  ).to(FundAdjustmentController);
  bind<FundAdjustmentRepository>(
    FUND_ADJUSTMENT_TYPES.FundAdjustmentRepository,
  ).to(FundAdjustmentRepository);
  bind<FundAdjustmentRouter>(FUND_ADJUSTMENT_TYPES.FundAdjustmentRouter).to(
    FundAdjustmentRouter,
  );
});

export { fundAdjustmentModule };
