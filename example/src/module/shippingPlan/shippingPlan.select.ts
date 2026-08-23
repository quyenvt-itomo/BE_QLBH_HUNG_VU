import { ShippingPlan } from "@/database/models/company/ShippingPlan";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ShippingPlanSelectFull: FindOptionsSelect<ShippingPlan> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  orderId: true,
  purchaseId: true,
  partnerId: true,
  partnerSnapshot: true,
  unitPrice: true,
  quantity: true,
  subTotal: true,
  taxRate: true,
  taxAmount: true,
  totalAmount: true,
  approveStatus: true,
  approvedAt: true,
  approverId: true,
  approverSnapshot: true,
  rejectReason: true,
};

export const ShippingPlanRelations: FindOptionsRelations<ShippingPlan> = {
  partner: true,
  order: true,
  purchase: true,
  approver: true,
};
