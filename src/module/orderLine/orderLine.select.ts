import { OrderLine } from "@/database/models/store/OrderLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const OrderLineSelectFull: FindOptionsSelect<OrderLine> = {
  ...BaseSelect,
  orderId: true,
  quotationLineId: true,
  type: true,
  productId: true,
  productSnapshot: true,
  serviceId: true,
  serviceSnapshot: true,
  unitId: true,
  unitSnapshot: true,
  quantity: true,
  unitPrice: true,
  taxRate: true,
  subTotal: true,
  taxAmount: true,
  grossAmount: true,
  commissionAmount: true,
  product: { id: true, name: true, code: true },
  unit: { id: true, name: true },
};

export const OrderLineRelations: FindOptionsRelations<OrderLine> = {
  product: true,
  unit: true,
};
