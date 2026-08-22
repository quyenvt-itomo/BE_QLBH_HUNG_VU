import { InventoryConversionLine } from "@/database/models/company/InventoryConversionLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const InventoryConversionLineSelectFull: FindOptionsSelect<InventoryConversionLine> =
  {
    ...BaseSelect,
    inventoryConversionId: true,
    fromProductId: true,
    fromProductSnapshot: true,
    fromUnitId: true,
    fromQuantity: true,
    toProductId: true,
    toProductSnapshot: true,
    toUnitId: true,
    toQuantity: true,
    quantity: true,
    fromProduct: { id: true, name: true, code: true },
    toProduct: { id: true, name: true, code: true },
  };

export const InventoryConversionLineRelations: FindOptionsRelations<InventoryConversionLine> =
  {
    fromProduct: true,
    toProduct: true,
  };
