import { ContainerModule } from "inversify";
import { PartnerDebtAdjustmentController } from "./partnerDebtAdjustment.controller";
import { PartnerDebtAdjustmentService } from "./partnerDebtAdjustment.service";
import { PartnerDebtAdjustmentRepository } from "./partnerDebtAdjustment.repository";
import { PartnerDebtAdjustmentRouter } from "./partnerDebtAdjustment.route";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "./partnerDebtAdjustment.types";

const partnerDebtAdjustmentModule = new ContainerModule((bind) => {
  bind<PartnerDebtAdjustmentService>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentService,
  ).to(PartnerDebtAdjustmentService);
  bind<PartnerDebtAdjustmentController>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentController,
  ).to(PartnerDebtAdjustmentController);
  bind<PartnerDebtAdjustmentRepository>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRepository,
  ).to(PartnerDebtAdjustmentRepository);
  bind<PartnerDebtAdjustmentRouter>(
    PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRouter,
  ).to(PartnerDebtAdjustmentRouter);
});

export { partnerDebtAdjustmentModule };
