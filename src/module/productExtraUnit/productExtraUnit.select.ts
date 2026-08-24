import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";

export const ProductExtraUnitSelectList: FindOptionsSelect<ProductExtraUnit> = {
  ...BaseSelect, productId: true, unitId: true, conversionRate: true, salePrice: true,
  unit: { id: true, name: true, type: true },
};
export const ProductExtraUnitSelectFull: FindOptionsSelect<ProductExtraUnit> = {
  ...ProductExtraUnitSelectList,
  product: { id: true, code: true, name: true, baseUnitId: true },
  unit: { id: true, name: true, type: true },
} as any;
export const ProductExtraUnitRelationsList: FindOptionsRelations<ProductExtraUnit> = { unit: true };
export const ProductExtraUnitRelations: FindOptionsRelations<ProductExtraUnit> = { product: true, unit: true };
