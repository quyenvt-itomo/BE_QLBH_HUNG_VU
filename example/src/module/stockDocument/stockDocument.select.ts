import { StockDocument } from "@/database/models/company/StockDocument";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const StockDocumentSelectList: FindOptionsSelect<StockDocument> = {
  ...BaseSelect,
  companyId: true,
  code: true,
  effectiveDate: true,
  type: true,
  status: true,

  orderId: true,
  orderSnapshot: true,
  order: true,

  purchaseId: true,
  purchaseSnapshot: true,
  purchase: true,

  productionId: true,
  productionSnapshot: true,
  production: true,

  partnerId: true,
  partnerSnapshot: true,
  partner: true,

  warehouseId: true,
  warehouseSnapshot: true,
  warehouse: { manager: true },

  shippingPlanId: true,
  shippingPlanSnapshot: true,
  shippingPlan: true,

  staffId: true,
  staffSnapshot: true,
  staff: true,

  confirmerId: true,
  confirmerSnapshot: true,
  confirmer: true,

  sequenceNumber: true,
  representative: true,
  vehicleType: true,
  vehiclePlate: true,

  totalVarianceAmount: true,

  actualExportDate: true,
  actualImportDate: true,

  lines: true,
};

export const StockDocumentSelectFull: FindOptionsSelect<StockDocument> = {
  ...StockDocumentSelectList,
  warehouse: { manager: true },
  lines: {
    id: true,
    stockDocumentId: true,
    purchaseLineId: true,
    purchaseLine: true,
    orderLineId: true,

    productId: true,
    productSnapshot: true,
    product: {
      baseUnit: true,
      extraUnits: { unit: true },
    },

    unitId: true,
    unitSnapshot: true,
    unit: true,

    conversionRateAtTime: true,
    requestQuantity: true,
    stockQuantity: true,
    additionalQuantity: true,
    billingQuantity: true,
    varianceQuantity: true,
    varianceAmount: true,
    note: true,
    sortOrder: true,
  },
};

export const StockDocumentRelationsList: FindOptionsRelations<StockDocument> = {
  purchase: true,
  order: true,
  partner: { group: true },
  warehouse: { manager: true },
  shippingPlan: true,
  staff: true,
  confirmer: true,
  lines: true,
};

export const StockDocumentRelations: FindOptionsRelations<StockDocument> = {
  ...StockDocumentRelationsList,
  warehouse: { manager: true },
  lines: { purchaseLine: true, orderLine: true, product: true, unit: true },
  gateLogs: true,
};

export const StockDocumentRelationSelectsForList: RelationSelectConfig<StockDocument> =
  {
    partner: ["id", "name", "code", "taxCode", "phone"],
    warehouse: { manager: ["id", "name", "code"] },
    shippingPlan: ["id", "code", "partnerId"],
    order: ["id", "code", "timeAt", "completedAt", "isCompleted"],
    purchase: ["id", "code", "orderedAt", "completedAt", "isCompleted"],
    staff: ["id", "name", "code", "phone"],
    confirmer: ["id", "name", "code", "phone"],
  };

export const StockDocumentRelationSelects: RelationSelectConfig<StockDocument> =
  {
    ...StockDocumentRelationSelectsForList,
    lines: {
      orderLine: true,
      purchaseLine: true,
      product: {
        baseUnit: true,
        extraUnits: { unit: ["id", "name"] },
      },
      unit: ["id", "name"],
    },
  };
