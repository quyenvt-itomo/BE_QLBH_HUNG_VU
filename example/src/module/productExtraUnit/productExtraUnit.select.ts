import { ProductExtraUnit } from "@/database/models/company/ProductExtraUnit";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductExtraUnitSelectFull: FindOptionsSelect<ProductExtraUnit> = {
  ...BaseSelect,
  productId: true,
  unitId: true,
  conversionRate: true,
  pricePerUnit: true,
  unit: { id: true, name: true },
};

export const ProductExtraUnitRelations: FindOptionsRelations<ProductExtraUnit> =
  {
    unit: true,
  };
