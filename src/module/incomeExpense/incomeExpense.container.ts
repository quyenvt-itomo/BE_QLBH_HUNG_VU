import { ContainerModule } from "inversify";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { IncomeExpenseController } from "./incomeExpense.controller";
import { IncomeExpenseService } from "./incomeExpense.service";
import { IncomeExpenseRepository } from "./incomeExpense.repository";
import { IncomeExpenseRouter } from "./incomeExpense.route";

export const incomeExpenseModule = new ContainerModule((bind) => {
  bind<IncomeExpenseController>(
    INCOME_EXPENSE_TYPES.IncomeExpenseController,
  ).to(IncomeExpenseController);
  bind<IncomeExpenseService>(INCOME_EXPENSE_TYPES.IncomeExpenseService).to(
    IncomeExpenseService,
  );
  bind<IncomeExpenseRepository>(
    INCOME_EXPENSE_TYPES.IncomeExpenseRepository,
  ).to(IncomeExpenseRepository);
  bind<IncomeExpenseRouter>(INCOME_EXPENSE_TYPES.IncomeExpenseRouter).to(
    IncomeExpenseRouter,
  );
});
