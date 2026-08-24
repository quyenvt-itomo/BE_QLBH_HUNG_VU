import { createSimpleModule } from "../_shared/simple.bind";
import { DebtAdjustmentRepository } from "./debtAdjustment.repository";
import { DebtAdjustmentService } from "./debtAdjustment.service";
import { DebtAdjustmentController } from "./debtAdjustment.controller";
import { DebtAdjustmentRouter } from "./debtAdjustment.route";
import { DEBT_ADJUSTMENT_TYPES } from "./debtAdjustment.types";

export const debtAdjustmentModule = createSimpleModule(
  DEBT_ADJUSTMENT_TYPES,
  DebtAdjustmentRepository,
  DebtAdjustmentService,
  DebtAdjustmentController,
  DebtAdjustmentRouter,
);
