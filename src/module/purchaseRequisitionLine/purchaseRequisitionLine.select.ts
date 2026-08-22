import { PurchaseRequisitionLine } from "@/database/models/company/PurchaseRequisitionLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PurchaseRequisitionLineSelectFull: FindOptionsSelect<PurchaseRequisitionLine> =
  {
    ...BaseSelect,
    purchaseRequisitionId: true,
    productId: true,
    productSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    quantity: true,
    product: { id: true, name: true, code: true },
    unit: { id: true, name: true },
  };

export const PurchaseRequisitionLineRelations: FindOptionsRelations<PurchaseRequisitionLine> =
  {
    product: true,
    unit: true,
  };
