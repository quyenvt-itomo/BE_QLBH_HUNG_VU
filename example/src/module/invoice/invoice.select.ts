import { Invoice } from "@/database/models/company/Invoice";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const InvoiceSelectFull: FindOptionsSelect<Invoice> = {
  ...BaseSelect,
  storeId: true,
  invoiceDate: true,
  invoiceNumber: true,
  type: true,
  sourceType: true,
  partnerId: true,
  partnerSnapshot: true,
  orderId: true,
  orderSnapshot: true,
  purchaseId: true,
  purchaseSnapshot: true,
  shippingPlanId: true,
  shippingPlanSnapshot: true,
  subTotal: true,
  taxAmount: true,
  totalAmount: true,
  lines: true,
};

export const InvoiceRelations: FindOptionsRelations<Invoice> = {
  partner: true,
  order: true,
  purchase: true,
  shippingPlan: true,
};
