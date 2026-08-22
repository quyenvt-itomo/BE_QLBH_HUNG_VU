import { ContainerModule } from "inversify";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "./vatDebtAdjustment.types";
import { VatDebtAdjustmentController } from "./vatDebtAdjustment.controller";
import { VatDebtAdjustmentService } from "./vatDebtAdjustment.service";
import { VatDebtAdjustmentRepository } from "./vatDebtAdjustment.repository";
import { VatDebtAdjustmentRouter } from "./vatDebtAdjustment.route";

export const vatDebtAdjustmentModule = new ContainerModule((bind) => {
  bind<VatDebtAdjustmentController>(
    VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentController,
  ).to(VatDebtAdjustmentController);
  bind<VatDebtAdjustmentService>(
    VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentService,
  ).to(VatDebtAdjustmentService);
  bind<VatDebtAdjustmentRepository>(
    VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRepository,
  ).to(VatDebtAdjustmentRepository);
  bind<VatDebtAdjustmentRouter>(
    VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRouter,
  ).to(VatDebtAdjustmentRouter);
});
