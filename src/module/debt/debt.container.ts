import { ContainerModule } from "inversify";
import { DebtService } from "./debt.service";
import { DebtController } from "./debt.controller";
import { DebtRecalculateService } from "./debt.recalculate.service";
import { DebtRouter } from "./debt.route";
import { DEBT_TYPES } from "./debt.types";

export const debtModule = new ContainerModule((bind) => {
  bind(DEBT_TYPES.DebtService).to(DebtService).inSingletonScope();
  bind(DEBT_TYPES.DebtController).to(DebtController).inSingletonScope();
  bind(DEBT_TYPES.DebtRecalculateService)
    .to(DebtRecalculateService)
    .inSingletonScope();
  bind(DEBT_TYPES.DebtRouter).to(DebtRouter).inSingletonScope();
});
