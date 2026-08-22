import { StoreTransfer } from "@/database/models/StoreTransfer";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import {
  StoreTransferLineSelectFull,
  StoreTransferLineRelations,
} from "./storeTransferLine";

export const StoreTransferSelectBasic: FindOptionsSelect<StoreTransfer> = {
  ...BaseSelect,
  occurredAt: true,
  code: true,
  fromStoreId: true,
  toStoreId: true,
  reason: true,
};

export const StoreTransferSelectFull: FindOptionsSelect<StoreTransfer> = {
  ...StoreTransferSelectBasic,
  lines: StoreTransferLineSelectFull,
  fromStore: true,
  toStore: true,
};

export const StoreTransferRelations: FindOptionsRelations<StoreTransfer> = {
  fromStore: true,
  toStore: true,
  lines: StoreTransferLineRelations,
};
