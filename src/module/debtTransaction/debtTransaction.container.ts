import { ContainerModule } from "inversify";
import { DEBT_TRANSACTION_TYPES } from "./debtTransaction.types";
import { DebtTransactionRepository } from "./debtTransaction.repository";
import { DebtTransactionService } from "./debtTransaction.service";
import { DebtTransactionController } from "./debtTransaction.controller";
import { DebtTransactionRouter } from "./debtTransaction.route";

export const debtTransactionModule = new ContainerModule((bind) => {
  bind(DEBT_TRANSACTION_TYPES.Repository)
    .to(DebtTransactionRepository)
    .inSingletonScope();
  bind(DEBT_TRANSACTION_TYPES.Service)
    .to(DebtTransactionService)
    .inSingletonScope();
  bind(DEBT_TRANSACTION_TYPES.Controller)
    .to(DebtTransactionController)
    .inSingletonScope();
  bind(DEBT_TRANSACTION_TYPES.Router)
    .to(DebtTransactionRouter)
    .inSingletonScope();
});
