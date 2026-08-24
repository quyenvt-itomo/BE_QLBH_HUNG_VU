import { Product } from "@/database/models";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductSelectBasic: FindOptionsSelect<Product> = {
  ...BaseSelect,
  groupId: true,
  brandId: true,
  code: true,
  name: true,
  baseUnitId: true,
  stockMetadata: true,
  group: { id: true, name: true, type: true, parentId: true },
  brand: { id: true, name: true, type: true },
  baseUnit: { id: true, name: true, type: true },
};
export const ProductSelectList = ProductSelectBasic;

export const ProductSelectFull: FindOptionsSelect<Product> = {
  ...ProductSelectBasic,
  group: { id: true, name: true, type: true, parentId: true },
  brand: { id: true, name: true, type: true },
  baseUnit: { id: true, name: true, type: true },
  extraUnits: {
    id: true,
    unitId: true,
    unit: { id: true, name: true, type: true },
    conversionRate: true,
    salePrice: true,
  },
} as any;

export const ProductRelations: FindOptionsRelations<Product> = {
  group: true,
  brand: true,
  baseUnit: true,
  extraUnits: { unit: true },
};
export const ProductRelationsList: FindOptionsRelations<Product> = {
  group: true,
  brand: true,
  baseUnit: true,
};
