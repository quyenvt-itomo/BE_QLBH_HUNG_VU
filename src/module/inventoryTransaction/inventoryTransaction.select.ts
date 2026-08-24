import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";

export const InventoryTransactionSelectList: FindOptionsSelect<InventoryTransaction> = {
  ...BaseSelect, occurredAt: true, productId: true, storeId: true, quantity: true,
  amount: true, type: true, costPriceAfter: true, quantityAfter: true,
  inventoryValueAfter: true, refType: true, refId: true, refCode: true,
};
export const InventoryTransactionSelectFull: FindOptionsSelect<InventoryTransaction> = InventoryTransactionSelectList;
export const InventoryTransactionRelationsList: FindOptionsRelations<InventoryTransaction> = {};
export const InventoryTransactionRelations: FindOptionsRelations<InventoryTransaction> = {};
