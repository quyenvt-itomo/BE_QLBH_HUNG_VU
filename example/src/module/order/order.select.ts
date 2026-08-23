import { Order } from "@/database/models/company/Order";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const OrderSelectList: FindOptionsSelect<Order> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  timeAt: true,
  quotationId: true,

  customerId: true,
  customerSnapshot: true,

  staffId: true,
  staffSnapshot: true,

  meshSpecId: true,
  meshSpecSnapshot: true,

  additionalInfo: true,

  subTotal: true,
  taxAmount: true,
  totalAmount: true,
  totalCommissionAmount: true,
  totalCost: true,

  isCompleted: true,
  completedAt: true,
  productionCount: true,

  lines: true,
  commissions: true,
};

export const OrderSelectFull: FindOptionsSelect<Order> = {
  ...OrderSelectList,
  customer: true,
  staff: true,
  meshSpec: true,
  quotation: true,
  lines: {
    id: true,
    orderId: true,
    quotationLineId: true,
    type: true,
    productId: true,
    productSnapshot: true,
    product: {
      baseUnit: true,
      extraUnits: { unit: true },
    },
    serviceId: true,
    serviceSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    unit: true,
    quantity: true,
    unitPrice: true,
    taxRate: true,
    subTotal: true,
    taxAmount: true,
    grossAmount: true,
    commissionAmount: true,
    deliveredQuantity: true,
    note: true,
    sortOrder: true,
    commissionDetails: {
      id: true,
      orderCommissionId: true,
      orderLineId: true,
      totalAmount: true,
    },
  },
  commissions: {
    id: true,
    orderId: true,
    partnerContactId: true,
    partnerContactSnapshot: true,
    totalAmount: true,
    details: {
      id: true,
      orderCommissionId: true,
      orderLineId: true,
      totalAmount: true,
    },
  },
};

export const OrderRelationsList: FindOptionsRelations<Order> = {
  customer: { group: true },
  staff: true,
};

export const OrderRelations: FindOptionsRelations<Order> = {
  ...OrderRelationsList,
  lines: {
    product: true,
    unit: true,
    commissionDetails: true,
  },
  commissions: {
    partnerContact: true,
    details: true,
  },
  meshSpec: true,
  quotation: true,
};

export const OrderRelationSelectsForList: RelationSelectConfig<Order> = {
  customer: [
    "id",
    "name",
    "code",
    "taxCode",
    "phone",
    "email",
    "address",
    "group",
  ],
  staff: ["id", "name", "code", "phone", "email"],
};

export const OrderRelationSelects: RelationSelectConfig<Order> = {
  ...OrderRelationSelectsForList,
  lines: {
    product: {
      baseUnit: true,
      extraUnits: { unit: ["id", "name"] },
    },
    unit: ["id", "name"],
    commissionDetails: true,
  },
  commissions: {
    partnerContact: ["id", "name", "phone", "email"],
    details: true,
  },
  meshSpec: ["id", "code", "timeAt"],
  quotation: ["id", "code"],
};
