import { injectable } from "inversify";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { IncomeExpenseRelations, IncomeExpenseRelationsList, IncomeExpenseSelectFull, IncomeExpenseSelectList } from "./incomeExpense.select";
@injectable()
export class IncomeExpenseRepository extends BaseRepository<IncomeExpense> {
  protected entityClass = IncomeExpense;
  protected selectedFields = IncomeExpenseSelectFull;
  protected selectedFieldsForList = IncomeExpenseSelectList;
  protected relations = IncomeExpenseRelations;
  protected relationsForList = IncomeExpenseRelationsList;
}
