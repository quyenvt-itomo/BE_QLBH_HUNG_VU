import { InventoryAdjustment } from "@/database/models/company/InventoryAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const InventoryAdjustmentSelectFull: FindOptionsSelect<InventoryAdjustment> =
  {
    ...BaseSelect,
    companyId: true,
    code: true,
    warehouseId: true,
    occurredAt: true,
    reason: true,
    totalAdjustmentQuantity: true,
    totalAdjustmentValue: true,
    isInitialAdjustment: true,
    lines: {
      id: true,
      adjustmentId: true,
      productId: true,
      expectedQuantity: true,
      countedQuantity: true,
      deltaQuantity: true,
      type: true,
      costPriceAtTime: true,
      adjustmentValue: true,
      sortOrder: true,
    },
  };

export const InventoryAdjustmentRelations: FindOptionsRelations<InventoryAdjustment> =
  {
    lines: true,
    warehouse: true,
  };
