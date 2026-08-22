import { Order } from "@/database/models/store/Order";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { PartnerRelations, PartnerSelectFull } from "../partner";
import { OrderLineRelations, OrderLineSelectFull } from "./orderLine";
import { EmployeeRelations, EmployeeSelectFull } from "../employee";

export const OrderSelectBasic: FindOptionsSelect<Order> = {
  ...BaseSelect,
  code: true,
  type: true,
  storeId: true,

  partnerId: true,
  partnerSnapshot: true,

  employeeId: true,
  employeeSnapshot: true,

  orderAt: true,

  discountType: true,
  discountValue: true,

  grossAmount: true,
  lineDiscountAmount: true,
  orderDiscountAmount: true,
  netAmount: true,
  taxAmount: true,
  totalAmount: true,

  shippingProviderId: true,
  shippingProviderSnapshot: true,
  shippingFee: true,
  isFreeShipping: true,
  status: true,
};

export const OrderSelectFull: FindOptionsSelect<Order> = {
  ...OrderSelectBasic,
  partner: PartnerSelectFull,
  employee: EmployeeSelectFull,
  shippingProvider: PartnerSelectFull,
  lines: OrderLineSelectFull,
  store: true,

  refOrder: true,
  incomeExpenses: true,
};

export const OrderRelations: FindOptionsRelations<Order> = {
  partner: PartnerRelations,
  employee: EmployeeRelations,
  shippingProvider: PartnerRelations,
  lines: OrderLineRelations,
  store: true,

  refOrder: true,

  incomeExpenses: { fund: true, category: true },
};
