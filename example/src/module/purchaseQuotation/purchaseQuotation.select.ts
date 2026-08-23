import { PurchaseQuotation } from "@/database/models/company/PurchaseQuotation";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PurchaseQuotationSelectList: FindOptionsSelect<PurchaseQuotation> =
  {
    ...BaseSelect,
    storeId: true,
    code: true,
    timeAt: true,

    staffId: true,
    staffSnapshot: true,

    supplierId: true,
    supplierSnapshot: true,

    quoterId: true,
    quoterSnapshot: true,

    subTotal: true,
    taxAmount: true,
    totalAmount: true,
    approveStatus: true,
    approvedAt: true,

    approverId: true,
    approverSnapshot: true,

    rejectReason: true,
    lines: true,
  };

export const PurchaseQuotationSelectFull: FindOptionsSelect<PurchaseQuotation> =
  {
    ...PurchaseQuotationSelectList,
    supplier: true,
    staff: true,
    quoter: true,
    approver: true,
    lines: {
      id: true,
      purchaseQuotationId: true,

      productId: true,
      productSnapshot: true,
      product: {
        baseUnit: true,
        extraUnits: { unit: true },
      },

      unitId: true,
      unitSnapshot: true,
      unit: true,

      quantity: true,
      unitPrice: true,
      taxRate: true,
      subTotal: true,
      taxAmount: true,
      grossAmount: true,
    },
  };

export const PurchaseQuotationRelationsList: FindOptionsRelations<PurchaseQuotation> =
  {
    supplier: true,
    quoter: true,
    staff: true,
    approver: true,
  };

export const PurchaseQuotationRelations: FindOptionsRelations<PurchaseQuotation> =
  {
    ...PurchaseQuotationRelationsList,
    lines: { product: true, unit: true },
    quoter: true,
  };

export const PurchaseQuotationRelationSelectsForList: RelationSelectConfig<PurchaseQuotation> =
  {
    staff: ["id", "name", "code", "phone", "email"],
    quoter: ["id", "name", "phone", "email"],
    supplier: ["id", "name", "code", "taxCode", "address"],
    approver: ["id", "name", "code", "phone", "email"],
  };

export const PurchaseQuotationRelationSelects: RelationSelectConfig<PurchaseQuotation> =
  {
    ...PurchaseQuotationRelationSelectsForList,
    lines: {
      product: {
        baseUnit: true,
        extraUnits: { unit: ["id", "name"] },
      },
      unit: ["id", "name"],
    },
  };
