import { Shift } from "@/database/models/store/Shift";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ShiftSelectBasic: FindOptionsSelect<Shift> = {
  ...BaseSelect,
  startAt: true,
  openingCash: true,
  openingCashSnapshot: true,
  openingChecklist: true,
  endAt: true,
  totalSaleOrder: true,
  totalSaleReturnOrder: true,
  totalRevenue: true,
  totalDebtAmount: true,
  totalCashInFromOrders: true,
  totalCashIn: true,
  totalCashOut: true,
  expectedCash: true,
  closingCash: true,
  closingCashSnapshot: true,
  difference: true,
  closingChecklist: true,
  status: true,
  storeId: true,
};

export const ShiftSelectFull: FindOptionsSelect<Shift> = {
  ...ShiftSelectBasic,
  store: true,
};

export const ShiftRelations: FindOptionsRelations<Shift> = {
  store: true,
};
