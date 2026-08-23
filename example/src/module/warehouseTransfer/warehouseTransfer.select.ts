import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const WarehouseTransferSelectFull: FindOptionsSelect<WarehouseTransfer> =
  {
    ...BaseSelect,
    storeId: true,
    code: true,
    timeAt: true,
    fromWarehouseId: true,
    fromWarehouseSnapshot: true,
    toWarehouseId: true,
    toWarehouseSnapshot: true,
    reason: true,
    exportedAt: true,
    exporterId: true,
    exporterSnapshot: true,
    importedAt: true,
    importerId: true,
    importerSnapshot: true,
    lines: {
      id: true,
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
    },
  };

export const WarehouseTransferRelations: FindOptionsRelations<WarehouseTransfer> =
  {
    lines: true,
    fromWarehouse: true,
    toWarehouse: true,
  };
