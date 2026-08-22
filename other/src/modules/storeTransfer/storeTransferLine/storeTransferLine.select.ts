import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import {
  ProductVariantRelations,
  ProductVariantSelectFull,
} from "@/modules/product";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const StoreTransferLineSelectBasic: FindOptionsSelect<StoreTransferLine> =
  {
    ...BaseSelect,
    transferId: true,
    productVariantId: true,
    productVariantSnapshot: true,
    quantity: true,
    sortOrder: true,
  };

export const StoreTransferLineSelectFull: FindOptionsSelect<StoreTransferLine> =
  {
    ...StoreTransferLineSelectBasic,
    productVariant: {
      ...ProductVariantSelectFull,
      product: { unit: true },
    },
  };

export const StoreTransferLineRelations: FindOptionsRelations<StoreTransferLine> =
  {
    productVariant: {
      ...ProductVariantRelations,
      product: { unit: true },
    },
  };
