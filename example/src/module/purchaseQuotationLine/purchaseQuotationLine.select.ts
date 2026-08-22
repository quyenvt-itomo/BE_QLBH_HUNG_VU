import { PurchaseQuotationLine } from "@/database/models/company/PurchaseQuotationLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PurchaseQuotationLineSelectFull: FindOptionsSelect<PurchaseQuotationLine> =
  {
    ...BaseSelect,
    purchaseQuotationId: true,
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
    product: { id: true, name: true, code: true },
    unit: { id: true, name: true },
  };

export const PurchaseQuotationLineRelations: FindOptionsRelations<PurchaseQuotationLine> =
  {
    product: true,
    unit: true,
  };
