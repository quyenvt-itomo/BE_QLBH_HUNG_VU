import { ContainerModule } from "inversify";
import { PARTNER_DEBT_SYNC_TYPES } from "./partnerDebtSync.types";
import { PartnerDebtSyncService } from "./partnerDebtSync.service";

export const partnerDebtSyncModule = new ContainerModule((bind) => {
  bind<PartnerDebtSyncService>(
    PARTNER_DEBT_SYNC_TYPES.PartnerDebtSyncService,
  ).to(PartnerDebtSyncService);
});

export * from "./partnerDebtSync.types";
export * from "./partnerDebtSync.service";
