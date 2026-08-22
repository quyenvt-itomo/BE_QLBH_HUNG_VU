import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import {
  InventoryAdjustmentLineRelations,
  InventoryAdjustmentLineSelectFull,
} from "./inventoryAdjustmentLine";

export const InventoryAdjustmentSelectBasic: FindOptionsSelect<InventoryAdjustment> =
  {
    ...BaseSelect,
    code: true,
    occurredAt: true,
    storeId: true,
    adjustedById: true,
    reason: true,
    totalAdjustmentQty: true,
    totalAdjustmentValue: true,
  };

export const InventoryAdjustmentSelectFull: FindOptionsSelect<InventoryAdjustment> =
  {
    ...InventoryAdjustmentSelectBasic,
    lines: InventoryAdjustmentLineSelectFull,
    store: true,
    adjustedBy: true,
  };

export const InventoryAdjustmentRelations: FindOptionsRelations<InventoryAdjustment> =
  {
    lines: InventoryAdjustmentLineRelations,
    store: true,
    adjustedBy: true,
  };
