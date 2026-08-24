import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";

export const InventoryAdjustmentLineSelectList: FindOptionsSelect<InventoryAdjustmentLine> = {
  ...BaseSelect, adjustmentId: true, productId: true, productSnapshot: true,
  expectedQuantity: true, countedQuantity: true, adjustmentQuantity: true, adjustmentAmount: true,
  product: { id: true, code: true, name: true, baseUnitId: true },
};
export const InventoryAdjustmentLineSelectFull: FindOptionsSelect<InventoryAdjustmentLine> = {
  ...InventoryAdjustmentLineSelectList,
  product: { id: true, code: true, name: true, baseUnitId: true },
  adjustment: { id: true, storeId: true, code: true, occurredAt: true },
} as any;
export const InventoryAdjustmentLineRelationsList: FindOptionsRelations<InventoryAdjustmentLine> = { product: true };
export const InventoryAdjustmentLineRelations: FindOptionsRelations<InventoryAdjustmentLine> = {
  product: true, adjustment: true,
} as any;
