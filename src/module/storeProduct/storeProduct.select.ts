import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { StoreProduct } from "@/database/models/store/StoreProduct";

export const StoreProductSelectList: FindOptionsSelect<StoreProduct> = {
  ...BaseSelect, storeId: true, productId: true, costPrice: true, isSelling: true,
  locations: { id: true, locationId: true, location: { id: true, name: true, type: true } },
  product: { id: true, code: true, name: true, baseUnitId: true },
};
export const StoreProductSelectFull: FindOptionsSelect<StoreProduct> = {
  ...StoreProductSelectList,
  product: { id: true, code: true, name: true, baseUnitId: true },
  store: { id: true, code: true, name: true },
} as any;
export const StoreProductRelationsList: FindOptionsRelations<StoreProduct> = { product: true, locations: { location: true } };
export const StoreProductRelations: FindOptionsRelations<StoreProduct> = { product: true, store: true, locations: { location: true } };
