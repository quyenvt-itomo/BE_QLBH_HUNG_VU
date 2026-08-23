import { injectable, inject } from "inversify";
import { IncomeExpenseService } from "./incomeExpense.service";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { BaseController } from "@/shared/base/BaseController";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";

@injectable()
export class IncomeExpenseController extends BaseController<IncomeExpense> {
  protected service: IncomeExpenseService;

  constructor(
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseService)
    service: IncomeExpenseService,
  ) {
    super();
    this.service = service;
  }
}
