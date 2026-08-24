import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";

export const IncomeExpenseSelectList: FindOptionsSelect<IncomeExpense> = {
  ...BaseSelect, storeId: true, occurredAt: true, code: true, type: true, fundId: true,
  fundSnapshot: true, orderId: true, categoryId: true, categorySnapshot: true,
  partnerId: true, partnerSnapshot: true, description: true, amount: true,
  fund: { id: true, code: true, name: true, type: true, storeId: true },
  category: { id: true, name: true, type: true, parentId: true, storeId: true },
  partner: { id: true, type: true, name: true, code: true, phone: true },
};
export const IncomeExpenseSelectFull: FindOptionsSelect<IncomeExpense> = {
  ...IncomeExpenseSelectList,
  fund: { id: true, code: true, name: true, type: true, storeId: true },
  category: { id: true, name: true, type: true, parentId: true, storeId: true },
  partner: { id: true, type: true, name: true, code: true, phone: true },
  order: { id: true, code: true, type: true, status: true, orderAt: true },
} as any;
export const IncomeExpenseRelationsList: FindOptionsRelations<IncomeExpense> = {
  fund: true, category: true, partner: true,
};
export const IncomeExpenseRelations: FindOptionsRelations<IncomeExpense> = {
  ...IncomeExpenseRelationsList, order: true,
} as any;
