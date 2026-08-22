import { ContainerModule } from "inversify";
import { PARTNER_DEBT_TYPES } from "./partnerDebt.types";
import { PartnerDebtService } from "./partnerDebt.service";
import { PartnerDebtController } from "./partnerDebt.controller";
import { PartnerDebtRecalculateService } from "./partnerDebtRecalculate.service";
import { PartnerDebtRouter } from "./partnerDebt.route";

export const partnerDebtModule = new ContainerModule((bind) => {
  bind<PartnerDebtService>(PARTNER_DEBT_TYPES.PartnerDebtService).to(
    PartnerDebtService,
  );
  bind<PartnerDebtController>(PARTNER_DEBT_TYPES.PartnerDebtController).to(
    PartnerDebtController,
  );
  bind<PartnerDebtRecalculateService>(
    PARTNER_DEBT_TYPES.PartnerDebtRecalculateService,
  ).to(PartnerDebtRecalculateService);
  bind<PartnerDebtRouter>(PARTNER_DEBT_TYPES.PartnerDebtRouter).to(
    PartnerDebtRouter,
  );
});
