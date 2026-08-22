import { ContainerModule } from "inversify";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "./partnerDebtAdjustment.types";
import { PartnerDebtAdjustmentController } from "./partnerDebtAdjustment.controller";
import { PartnerDebtAdjustmentService } from "./partnerDebtAdjustment.service";
import { PartnerDebtAdjustmentRepository } from "./partnerDebtAdjustment.repository";
import { PartnerDebtAdjustmentRouter } from "./partnerDebtAdjustment.route";

export const partnerDebtAdjustmentModule = new ContainerModule((bind) => {
  bind<PartnerDebtAdjustmentController>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentController,
  ).to(PartnerDebtAdjustmentController);
  bind<PartnerDebtAdjustmentService>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentService,
  ).to(PartnerDebtAdjustmentService);
  bind<PartnerDebtAdjustmentRepository>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRepository,
  ).to(PartnerDebtAdjustmentRepository);
  bind<PartnerDebtAdjustmentRouter>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRouter,
  ).to(PartnerDebtAdjustmentRouter);
});
