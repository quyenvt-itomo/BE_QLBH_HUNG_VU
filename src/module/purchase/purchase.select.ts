import { Purchase } from "@/database/models/company/Purchase";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PurchaseSelectList: FindOptionsSelect<Purchase> = {
  ...BaseSelect,
  companyId: true,
  code: true,
  orderedAt: true,

  supplierId: true,
  supplierSnapshot: true,
  supplier: { group: true },

  sellerId: true,
  sellerSnapshot: true,
  seller: true,

  staffId: true,
  staffSnapshot: true,
  staff: true,

  paymentMethod: true,
  toleranceRate: true,
  discountType: true,
  discountValue: true,
  discountAmount: true,
  taxType: true,
  taxValue: true,
  subTotal: true,
  taxAmount: true,
  totalAmount: true,
  totalCommissionAmount: true,
  totalActualCommissionAmount: true,
  additionalInfo: true,

  approveStatus: true,
  approvedAt: true,
  rejectReason: true,

  approverId: true,
  approverSnapshot: true,
  approver: true,

  isCompleted: true,
  completedAt: true,
  lines: true,
};

export const PurchaseSelectFull: FindOptionsSelect<Purchase> = {
  ...PurchaseSelectList,
  lines: {
    id: true,
    purchaseId: true,
    productId: true,
    productSnapshot: true,
    product: { baseUnit: true },

    unitId: true,
    unitSnapshot: true,
    unit: true,
    conversionRateAtTime: true,

    quantity: true,
    unitPrice: true,
    taxRate: true,
    subTotal: true,
    taxAmount: true,
    grossAmount: true,
    commissionRate: true,
    commissionAmount: true,
    deliveredQuantity: true,
    actualCommissionAmount: true,
    note: true,
  },
};

export const PurchaseRelationsList: FindOptionsRelations<Purchase> = {
  supplier: { group: true },
  seller: true,
  staff: true,
  approver: true,
  lines: true,
};

export const PurchaseRelations: FindOptionsRelations<Purchase> = {
  ...PurchaseRelationsList,
  lines: { product: { baseUnit: true }, unit: true },
  seller: true,
};

export const PurchaseRelationSelectsForList: RelationSelectConfig<Purchase> = {
  supplier: [
    "id",
    "name",
    "code",
    "taxCode",
    "phone",
    "email",
    "address",
    "group",
  ],
  staff: ["id", "name", "code"],
  approver: ["id", "name", "code"],
};

export const PurchaseRelationSelects: RelationSelectConfig<Purchase> = {
  ...PurchaseRelationSelectsForList,
  seller: ["id", "name"],
  lines: { product: { baseUnit: ["id", "name"] }, unit: ["id", "name"] },
};
