import { ContainerModule } from "inversify";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { IncomeExpenseService } from "./incomeExpense.service";
import { IncomeExpenseController } from "./incomeExpense.controller";
import { IncomeExpenseRepository } from "./incomeExpense.repository";
import { IncomeExpenseRouter } from "./incomeExpense.route";

const incomeExpenseModule = new ContainerModule((bind) => {
  bind<IncomeExpenseService>(INCOME_EXPENSE_TYPES.IncomeExpenseService).to(
    IncomeExpenseService,
  );
  bind<IncomeExpenseController>(
    INCOME_EXPENSE_TYPES.IncomeExpenseController,
  ).to(IncomeExpenseController);
  bind<IncomeExpenseRepository>(
    INCOME_EXPENSE_TYPES.IncomeExpenseRepository,
  ).to(IncomeExpenseRepository);
  bind<IncomeExpenseRouter>(INCOME_EXPENSE_TYPES.IncomeExpenseRouter).to(
    IncomeExpenseRouter,
  );
});

export { incomeExpenseModule };
