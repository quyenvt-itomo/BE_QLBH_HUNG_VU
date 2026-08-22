import { QuotationLine } from "@/database/models/company/QuotationLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const QuotationLineSelectFull: FindOptionsSelect<QuotationLine> = {
  ...BaseSelect,
  quotationId: true,
  type: true,
  productId: true,
  productSnapshot: true,
  serviceId: true,
  serviceSnapshot: true,
  unitId: true,
  unitSnapshot: true,
  rawQuantity: true,
  rawUnitPrice: true,
  rawSubTotal: true,
  rawMaterialQuantity: true,
  rawMaterialUnitPrice: true,
  rawAdditionalCost: true,
  rawMaterialTotalCost: true,
  rawProfit: true,
  materialId: true,
  product: { id: true, name: true, code: true },
  unit: { id: true, name: true },
};

export const QuotationLineRelations: FindOptionsRelations<QuotationLine> = {
  product: true,
  unit: true,
};
