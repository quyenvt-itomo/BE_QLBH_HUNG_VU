import { PaymentTerm } from "@/database/models/company/PaymentTerm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PaymentTermSelectFull: FindOptionsSelect<PaymentTerm> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  name: true,
  depositRate: true,
  maxDebtDays: true,
  maxDebtAmount: true,
};

export const PaymentTermRelations: FindOptionsRelations<PaymentTerm> = {};
