import { IncomeExpense } from "@/database/models/company/IncomeExpense";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const IncomeExpenseSelectFull: FindOptionsSelect<IncomeExpense> = {
  ...BaseSelect,
  companyId: true,
  occurredAt: true,
  code: true,
  type: true,
  fundId: true,
  fundSnapshot: true,
  staffId: true,
  staffSnapshot: true,
  amount: true,
  categoryId: true,
  categorySnapshot: true,
  partnerId: true,
  partnerSnapshot: true,
  isVatPayment: true,
  invoiceAllocations: {
    id: true,
    incomeExpenseId: true,
    invoiceId: true,
    invoiceSnapshot: true,
    amount: true,
    allocatedAt: true,
  },
};

export const IncomeExpenseRelations: FindOptionsRelations<IncomeExpense> = {
  fund: true,
  partner: true,
  staff: true,
  category: true,
  invoiceAllocations: true,
};
