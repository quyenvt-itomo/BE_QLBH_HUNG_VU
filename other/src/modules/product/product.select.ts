import { Product } from "@/database/models/Product";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import {
  ProductOptionSelectBasic,
  ProductOptionRelations,
} from "./productOption";
import {
  ProductVariantSelectBasic,
  ProductVariantRelations,
} from "./productVariant";

export const ProductSelectBasic: FindOptionsSelect<Product> = {
  ...BaseSelect,
  name: true,
  code: true,
  taxRate: true,

  categoryId: true,
  unitId: true,

  hasVariant: true,
};

export const ProductSelectFull: FindOptionsSelect<Product> = {
  ...ProductSelectBasic,
  category: {
    parent: {
      parent: {
        parent: true,
      },
    },
  },
  unit: true,
  variants: ProductVariantSelectBasic,
  options: ProductOptionSelectBasic,
};

/**
 * Relations cho detail (getById, findOne)
 */
export const ProductRelations: FindOptionsRelations<Product> = {
  category: {
    parent: {
      parent: {
        parent: true,
      },
    },
  },
  unit: true,
  variants: ProductVariantRelations,
  options: ProductOptionRelations,
};
