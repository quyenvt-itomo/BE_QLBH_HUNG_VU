import { ContainerModule } from "inversify";
import { VAT_DEBT_SYNC_TYPES } from "./vatDebtSync.types";
import { VatDebtSyncService } from "./vatDebtSync.service";

export const vatDebtSyncModule = new ContainerModule((bind) => {
  bind<VatDebtSyncService>(VAT_DEBT_SYNC_TYPES.VatDebtSyncService).to(
    VatDebtSyncService,
  );
});

export * from "./vatDebtSync.types";
export * from "./vatDebtSync.service";
