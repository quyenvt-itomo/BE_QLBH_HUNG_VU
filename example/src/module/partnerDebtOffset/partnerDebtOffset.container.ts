import { ContainerModule } from "inversify";
import { PARTNER_DEBT_OFFSET_TYPES } from "./partnerDebtOffset.types";
import { PartnerDebtOffsetController } from "./partnerDebtOffset.controller";
import { PartnerDebtOffsetService } from "./partnerDebtOffset.service";
import { PartnerDebtOffsetRepository } from "./partnerDebtOffset.repository";
import { PartnerDebtOffsetRouter } from "./partnerDebtOffset.route";

export const partnerDebtOffsetModule = new ContainerModule((bind) => {
  bind<PartnerDebtOffsetController>(
    PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetController,
  ).to(PartnerDebtOffsetController);
  bind<PartnerDebtOffsetService>(
    PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetService,
  ).to(PartnerDebtOffsetService);
  bind<PartnerDebtOffsetRepository>(
    PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRepository,
  ).to(PartnerDebtOffsetRepository);
  bind<PartnerDebtOffsetRouter>(
    PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRouter,
  ).to(PartnerDebtOffsetRouter);
});
