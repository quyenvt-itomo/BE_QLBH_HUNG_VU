import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";

export const InventoryAdjustmentSelectList: FindOptionsSelect<InventoryAdjustment> = {
  ...BaseSelect, storeId: true, code: true, occurredAt: true, reason: true,
  totalAdjustmentQuantity: true, totalAdjustmentAmount: true, isInitial: true, lines: true,
} as any;
export const InventoryAdjustmentSelectFull: FindOptionsSelect<InventoryAdjustment> = {
  ...InventoryAdjustmentSelectList,
  lines: {
    id: true, adjustmentId: true, productId: true, productSnapshot: true,
    expectedQuantity: true, countedQuantity: true, adjustmentQuantity: true, adjustmentAmount: true,
    product: { id: true, code: true, name: true, baseUnitId: true },
  },
} as any;
export const InventoryAdjustmentRelationsList: FindOptionsRelations<InventoryAdjustment> = {};
export const InventoryAdjustmentRelations: FindOptionsRelations<InventoryAdjustment> = {
  lines: { product: true },
} as any;
