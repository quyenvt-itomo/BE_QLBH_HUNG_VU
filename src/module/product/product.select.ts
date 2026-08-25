import { Product } from "@/database/models";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductSelectBasic: FindOptionsSelect<Product> = {
  ...BaseSelect,
  groupId: true,
  brandId: true,
  code: true,
  name: true,
  description: true,
  barcode: true,
  baseUnitId: true,
  salePrice: true,
  weight: true,
  weightUnit: true,
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
  storeProducts: {
    id: true,
    storeId: true,
    costPrice: true,
    isSelling: true,
    locationId: true,
    store: { id: true, code: true, name: true },
    location: { id: true, name: true, type: true },
  },
} as any;

export const ProductRelations: FindOptionsRelations<Product> = {
  group: true,
  brand: true,
  baseUnit: true,
  extraUnits: { unit: true },
  storeProducts: { store: true, location: true },
};
export const ProductRelationsList: FindOptionsRelations<Product> = {
  group: true,
  brand: true,
  baseUnit: true,
};
