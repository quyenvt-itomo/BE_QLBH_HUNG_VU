import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { OrderLine } from "@/database/models/store/OrderLine";

export const OrderLineSelectList: FindOptionsSelect<OrderLine> = {
  ...BaseSelect,
  orderId: true,
  returnOrderId: true,
  refOrderLineId: true,
  productId: true,
  productSnapshot: true,
  unitId: true,
  unitSnapshot: true,
  conversionRateAtTime: true,
  unitPrice: true,
  quantity: true,
  subTotal: true,
  totalCost: true,
  costPriceAtTime: true,
  product: { id: true, code: true, name: true, baseUnitId: true },
  unit: { id: true, name: true, type: true },
};

export const OrderLineSelectFull: FindOptionsSelect<OrderLine> = {
  ...OrderLineSelectList,
  product: {
    id: true,
    code: true,
    name: true,
    baseUnitId: true,
    baseUnit: { id: true, name: true },
    extraUnits: { id: true, unitId: true, conversionRate: true, isPurchaseUnit: true, unit: { id: true, name: true } },
  },
  unit: { id: true, name: true, type: true },
  order: { id: true, code: true, type: true, status: true, orderAt: true },
  returnOrder: { id: true, code: true, type: true, status: true, orderAt: true },
  refOrderLine: { id: true, orderId: true, productSnapshot: true, unitSnapshot: true },
} as any;

export const OrderLineRelationsList: FindOptionsRelations<OrderLine> = {
  product: { baseUnit: true },
  unit: true,
};

export const OrderLineRelations: FindOptionsRelations<OrderLine> = {
  ...OrderLineRelationsList,
  order: true,
  returnOrder: true,
  refOrderLine: true,
} as any;
