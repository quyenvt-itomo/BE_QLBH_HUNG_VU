import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const IncomeExpenseSelectBasic: FindOptionsSelect<IncomeExpense> = {
  ...BaseSelect,
  code: true,
  type: true,
  creatorId: true,
  creatorSnapshot: true,
  fundId: true,
  amount: true,
  categoryId: true,
  partnerId: true,
  partnerSnapshot: true,
  occurredAt: true,
  description: true,
};

export const IncomeExpenseSelectFull: FindOptionsSelect<IncomeExpense> = {
  ...IncomeExpenseSelectBasic,
  creator: true,
  fund: true,
  partner: true,
  category: { fundCategoryGroup: true },
  store: true,
};

export const IncomeExpenseRelations: FindOptionsRelations<IncomeExpense> = {
  creator: true,
  fund: true,
  partner: true,
  category: { fundCategoryGroup: true },
  store: true,
};
