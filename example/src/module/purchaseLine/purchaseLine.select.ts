import { PurchaseLine } from "@/database/models/company/PurchaseLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PurchaseLineSelectFull: FindOptionsSelect<PurchaseLine> = {
  ...BaseSelect,
  purchaseId: true,
  productId: true,
  productSnapshot: true,
  unitId: true,
  unitSnapshot: true,
  quantity: true,
  unitPrice: true,
  taxRate: true,
  subTotal: true,
  taxAmount: true,
  grossAmount: true,
  commissionRate: true,
  commissionAmount: true,
  product: { id: true, name: true, code: true },
  unit: { id: true, name: true },
};

export const PurchaseLineRelations: FindOptionsRelations<PurchaseLine> = {
  product: true,
  unit: true,
};
