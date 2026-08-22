import { ContainerModule } from "inversify";
import { VAT_DEBT_TYPES } from "./vatDebt.types";
import { VatDebtService } from "./vatDebt.service";
import { VatDebtController } from "./vatDebt.controller";
import { VatDebtRecalculateService } from "./vatDebtRecalculate.service";
import { VatDebtRouter } from "./vatDebt.route";

export const vatDebtModule = new ContainerModule((bind) => {
  bind<VatDebtService>(VAT_DEBT_TYPES.VatDebtService).to(VatDebtService);
  bind<VatDebtController>(VAT_DEBT_TYPES.VatDebtController).to(
    VatDebtController,
  );
  bind<VatDebtRecalculateService>(VAT_DEBT_TYPES.VatDebtRecalculateService).to(
    VatDebtRecalculateService,
  );
  bind<VatDebtRouter>(VAT_DEBT_TYPES.VatDebtRouter).to(VatDebtRouter);
});
