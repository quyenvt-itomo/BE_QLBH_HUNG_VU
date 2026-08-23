import { OrderCommission } from "@/database/models/store/OrderCommission";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const OrderCommissionSelectFull: FindOptionsSelect<OrderCommission> = {
  ...BaseSelect,
  orderId: true,
  partnerContactId: true,
  partnerContactSnapshot: true,
  totalAmount: true,
  partnerContact: {
    id: true,
    name: true,
    phone: true,
    email: true,
  },
};

export const OrderCommissionRelations: FindOptionsRelations<OrderCommission> = {
  partnerContact: true,
};
