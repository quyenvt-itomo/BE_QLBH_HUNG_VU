import { createSimpleModule } from "../_shared/simple.bind";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FundAdjustmentController } from "./fundAdjustment.controller";
import { FundAdjustmentRouter } from "./fundAdjustment.route";
export const fundAdjustmentModule = createSimpleModule(
  FUND_ADJUSTMENT_TYPES,
  FundAdjustmentRepository,
  FundAdjustmentService,
  FundAdjustmentController,
  FundAdjustmentRouter,
);
