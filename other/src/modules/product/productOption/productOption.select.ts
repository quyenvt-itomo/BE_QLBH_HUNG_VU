import { ProductOption } from "@/database/models/ProductOption";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ProductOptionSelectBasic: FindOptionsSelect<ProductOption> = {
  ...BaseSelect,
  productId: true,
  typeId: true,
  value: true,
  typeIndex: true,
  type: true,
};

export const ProductOptionSelectFull: FindOptionsSelect<ProductOption> = {
  ...ProductOptionSelectBasic,
};

export const ProductOptionRelations: FindOptionsRelations<ProductOption> = {
  type: true,
};
