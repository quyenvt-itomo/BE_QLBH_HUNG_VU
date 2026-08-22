import { ProductVariant } from "@/database/models/ProductVariant";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductVariantSelectBasic: FindOptionsSelect<ProductVariant> = {
  ...BaseSelect,
  productId: true,
  sku: true,
  barcode: true,
  costPrice: true,
  price: true,
  isActive: true,
  stockMetadata: true,
};

export const ProductVariantSelectFull: FindOptionsSelect<ProductVariant> = {
  ...ProductVariantSelectBasic,
  options: {
    id: true,
    value: true,
    type: true,
    typeIndex: true,
  },
  product: {
    id: true,
    code: true,
    name: true,
    categoryId: true,
    unitId: true,
    hasVariant: true,
    taxRate: true,
    unit: true,
    category: true,
  },
};

export const ProductVariantRelations: FindOptionsRelations<ProductVariant> = {
  options: {
    type: true,
  },
  product: {
    unit: true,
    category: true,
  },
};
