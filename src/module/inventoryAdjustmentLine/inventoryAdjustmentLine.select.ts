import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const InventoryAdjustmentLineSelectFull: FindOptionsSelect<InventoryAdjustmentLine> =
  {
    ...BaseSelect,
    adjustmentId: true,
    productId: true,
    expectedQuantity: true,
    countedQuantity: true,
    deltaQuantity: true,
    type: true,
    costPriceAtTime: true,
    adjustmentValue: true,
    sortOrder: true,
    product: { id: true, name: true, code: true },
  };

export const InventoryAdjustmentLineRelations: FindOptionsRelations<InventoryAdjustmentLine> =
  {
    product: true,
  };
