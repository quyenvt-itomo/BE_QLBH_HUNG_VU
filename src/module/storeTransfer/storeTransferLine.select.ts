import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";

export const StoreTransferLineSelectList: FindOptionsSelect<StoreTransferLine> = {
  ...BaseSelect, transferId: true, productId: true, productSnapshot: true, unitId: true,
  unitSnapshot: true, conversionRateAtTime: true, quantity: true, differenceCostPriceAmount: true,
  product: { id: true, code: true, name: true, baseUnitId: true },
  unit: { id: true, name: true, type: true },
};
export const StoreTransferLineSelectFull: FindOptionsSelect<StoreTransferLine> = {
  ...StoreTransferLineSelectList,
  product: { id: true, code: true, name: true, baseUnitId: true },
  unit: { id: true, name: true, type: true },
  transfer: { id: true, code: true, occurredAt: true, fromStoreId: true, toStoreId: true },
} as any;
export const StoreTransferLineRelationsList: FindOptionsRelations<StoreTransferLine> = { product: true, unit: true };
export const StoreTransferLineRelations: FindOptionsRelations<StoreTransferLine> = {
  product: true, unit: true, transfer: true,
} as any;
