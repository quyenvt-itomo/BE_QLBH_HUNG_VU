import { Product } from "@/database/models/company/Product";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductSelectBasic: FindOptionsSelect<Product> = {
  ...BaseSelect,
  companyId: true,
  type: true,
  groupId: true,
  code: true,
  name: true,
  baseUnitId: true,
  price: true,
  taxRate: true,
  stockMetadata: true,
  isPublic: true,
};

export const ProductSelectFull: FindOptionsSelect<Product> = {
  ...ProductSelectBasic,
  group: true,
  baseUnit: true,
  extraUnits: {
    id: true,
    unitId: true,
    conversionRate: true,
    pricePerUnit: true,
    unit: true,
  },
};

export const ProductRelations: FindOptionsRelations<Product> = {
  group: true,
  baseUnit: true,
  extraUnits: { unit: true },
};
