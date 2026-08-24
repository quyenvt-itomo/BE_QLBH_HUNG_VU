import { createSimpleModule } from "../_shared/simple.bind";
import { IncomeExpenseRepository } from "./incomeExpense.repository";
import { IncomeExpenseService } from "./incomeExpense.service";
import { IncomeExpenseController } from "./incomeExpense.controller";
import { IncomeExpenseRouter } from "./incomeExpense.route";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";

export const incomeExpenseModule = createSimpleModule(
  INCOME_EXPENSE_TYPES,
  IncomeExpenseRepository,
  IncomeExpenseService,
  IncomeExpenseController,
  IncomeExpenseRouter,
);
