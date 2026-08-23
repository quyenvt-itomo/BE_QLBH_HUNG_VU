import { Product } from "@/database/models";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductSelectBasic: FindOptionsSelect<Product> = {
  ...BaseSelect,
  groupId: true,
  code: true,
  name: true,
  baseUnitId: true,
  stockMetadata: true,
};

export const ProductSelectFull: FindOptionsSelect<Product> = {
  ...ProductSelectBasic,
  group: true,
  baseUnit: true,
  extraUnits: {
    id: true,
    unitId: true,
    unit: true,
    conversionRate: true,
    salePrice: true,
  },
};

export const ProductRelations: FindOptionsRelations<Product> = {
  group: true,
  baseUnit: true,
  extraUnits: { unit: true },
};
