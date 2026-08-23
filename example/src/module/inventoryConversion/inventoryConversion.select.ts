import { InventoryConversion } from "@/database/models/company/InventoryConversion";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const InventoryConversionSelectFull: FindOptionsSelect<InventoryConversion> =
  {
    ...BaseSelect,
    storeId: true,
    timeAt: true,
    code: true,
    staffId: true,
    staffSnapshot: true,
    reason: true,
    staff: { id: true, name: true, code: true },
  };

export const InventoryConversionRelations: FindOptionsRelations<InventoryConversion> =
  {
    staff: true,
  };
