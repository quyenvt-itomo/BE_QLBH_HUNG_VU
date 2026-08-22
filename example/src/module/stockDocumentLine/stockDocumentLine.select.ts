import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const StockDocumentLineSelectFull: FindOptionsSelect<StockDocumentLine> =
  {
    ...BaseSelect,
    stockDocumentId: true,
    purchaseLineId: true,
    orderLineId: true,
    productId: true,
    productSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    conversionRateAtTime: true,
    requestQuantity: true,
    stockQuantity: true,
    additionalQuantity: true,
    billingQuantity: true,
    varianceQuantity: true,
    varianceAmount: true,
    product: { id: true, name: true, code: true },
    unit: { id: true, name: true },
  };

export const StockDocumentLineRelations: FindOptionsRelations<StockDocumentLine> =
  {
    product: true,
    unit: true,
  };
