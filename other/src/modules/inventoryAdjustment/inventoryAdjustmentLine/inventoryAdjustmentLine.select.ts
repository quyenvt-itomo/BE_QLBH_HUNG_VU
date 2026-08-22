import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const InventoryAdjustmentLineSelectBasic: FindOptionsSelect<InventoryAdjustmentLine> =
  {
    ...BaseSelect,
    adjustmentId: true,
    productVariantId: true,
    expectedQty: true,
    countedQty: true,
    deltaQty: true,
    costPriceAtTime: true,
    sortOrder: true,
  };

export const InventoryAdjustmentLineSelectFull: FindOptionsSelect<InventoryAdjustmentLine> =
  {
    ...InventoryAdjustmentLineSelectBasic,
    productVariant: {
      product: { unit: true },
      options: { type: true },
    },
  };

export const InventoryAdjustmentLineRelations: FindOptionsRelations<InventoryAdjustmentLine> =
  {
    productVariant: {
      product: { unit: true },
      options: {
        type: true,
      },
    },
  };
