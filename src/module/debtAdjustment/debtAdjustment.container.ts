import { ContainerModule } from "inversify";
import { DebtAdjustmentRepository } from "./debtAdjustment.repository";
import { DebtAdjustmentService } from "./debtAdjustment.service";
import { DebtAdjustmentController } from "./debtAdjustment.controller";
import { DebtAdjustmentRouter } from "./debtAdjustment.route";
import { DEBT_ADJUSTMENT_TYPES } from "./debtAdjustment.types";

export const debtAdjustmentModule = new ContainerModule((bind) => {
  bind(DEBT_ADJUSTMENT_TYPES.Repository).to(DebtAdjustmentRepository).inSingletonScope();
  bind(DEBT_ADJUSTMENT_TYPES.Service).to(DebtAdjustmentService).inSingletonScope();
  bind(DEBT_ADJUSTMENT_TYPES.Controller).to(DebtAdjustmentController).inSingletonScope();
  bind(DEBT_ADJUSTMENT_TYPES.Router).to(DebtAdjustmentRouter).inSingletonScope();
});
