import { WarehouseTransferLine } from "@/database/models/company/WarehouseTransferLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const WarehouseTransferLineSelectFull: FindOptionsSelect<WarehouseTransferLine> =
  {
    ...BaseSelect,
    transferId: true,
    productId: true,
    productSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    conversionRateAtTime: true,
    requestQuantity: true,
    actualQuantity: true,
    receivedQuantity: true,
    sortOrder: true,
    product: { id: true, name: true, code: true },
    unit: { id: true, name: true },
  };

export const WarehouseTransferLineRelations: FindOptionsRelations<WarehouseTransferLine> =
  {
    product: true,
    unit: true,
  };
