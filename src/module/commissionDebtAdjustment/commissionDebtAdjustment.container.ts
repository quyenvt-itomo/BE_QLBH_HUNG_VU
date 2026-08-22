import { ContainerModule } from "inversify";
import { COMMISSION_DEBT_ADJUSTMENT_TYPES } from "./commissionDebtAdjustment.types";
import { CommissionDebtAdjustmentController } from "./commissionDebtAdjustment.controller";
import { CommissionDebtAdjustmentService } from "./commissionDebtAdjustment.service";
import { CommissionDebtAdjustmentRepository } from "./commissionDebtAdjustment.repository";
import { CommissionDebtAdjustmentRouter } from "./commissionDebtAdjustment.route";

export const commissionDebtAdjustmentModule = new ContainerModule((bind) => {
  bind<CommissionDebtAdjustmentController>(
    COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentController,
  ).to(CommissionDebtAdjustmentController);
  bind<CommissionDebtAdjustmentService>(
    COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentService,
  ).to(CommissionDebtAdjustmentService);
  bind<CommissionDebtAdjustmentRepository>(
    COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentRepository,
  ).to(CommissionDebtAdjustmentRepository);
  bind<CommissionDebtAdjustmentRouter>(
    COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentRouter,
  ).to(CommissionDebtAdjustmentRouter);
});
