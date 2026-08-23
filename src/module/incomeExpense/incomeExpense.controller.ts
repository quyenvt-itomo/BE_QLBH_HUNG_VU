import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { SimpleController } from "../_shared/simple.controller";
import { IncomeExpenseService } from "./incomeExpense.service";
export class IncomeExpenseController extends SimpleController<IncomeExpense> { constructor(service: IncomeExpenseService) { super(service); } }
