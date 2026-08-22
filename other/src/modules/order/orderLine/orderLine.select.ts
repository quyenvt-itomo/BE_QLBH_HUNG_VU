import { OrderLine } from "@/database/models/store/OrderLine";
import {
  ProductVariantRelations,
  ProductVariantSelectFull,
} from "@/modules/product";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const OrderLineSelectBasic: FindOptionsSelect<OrderLine> = {
  ...BaseSelect,
  orderId: true,
  productVariantId: true,
  productVariantSnapshot: true,

  unitPrice: true,
  quantity: true,
  subTotal: true,

  discountValue: true,
  discountType: true,
  discountAmount: true,

  orderDiscountAmount: true,
  netAmount: true,

  taxRate: true,
  taxAmount: true,

  totalAmount: true,

  sortOrder: true,
};

export const OrderLineSelectFull: FindOptionsSelect<OrderLine> = {
  ...OrderLineSelectBasic,
  productVariant: ProductVariantSelectFull,
};

export const OrderLineRelations: FindOptionsRelations<OrderLine> = {
  productVariant: ProductVariantRelations,
};
