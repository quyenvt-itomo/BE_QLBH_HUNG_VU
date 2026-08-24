import { inject, injectable } from "inversify";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { BaseController } from "@/shared/base/BaseController";
import { IncomeExpenseService } from "./incomeExpense.service";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
@injectable()
export class IncomeExpenseController extends BaseController<IncomeExpense> {
  protected service: IncomeExpenseService;
  constructor(@inject(INCOME_EXPENSE_TYPES.Service) service: IncomeExpenseService) { super(); this.service = service; }
}
