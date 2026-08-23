import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { SimpleRepository } from "../_shared/simple.repository";
export class IncomeExpenseRepository extends SimpleRepository<IncomeExpense> { constructor() { super(IncomeExpense); } }
