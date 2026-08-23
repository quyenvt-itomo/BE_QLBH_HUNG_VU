import { OrderStatus, OrderType, ReturnOrderTypes } from "@/database/models";
import {
  BaseCreateSchema,
  BaseLineSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { RateType } from "@/shared/constants/enum";
import * as z from "zod";

export const OrderLineSchema = BaseLineSchema.extend({
  orderId: z.uuid().nullish(),
  returnOrderId: z.uuid().nullish(),
  refOrderLineId: z.uuid().nullish(),

  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

export const CreateOrderSchema = BaseCreateSchema.extend({
  refOrderId: z.uuid().nullish(),

  type: z.enum(OrderType),
  code: z.string().optional(),
  orderAt: DateTransform.optional(),

  partnerId: z.uuid().nullish(),

  discountType: z.enum(RateType).optional().default(RateType.AMOUNT),
  discountValue: z.number().nullish(),

  taxType: z.enum(RateType).optional().default(RateType.AMOUNT),
  taxValue: z.number().nullish(),

  shipperId: z.uuid().nullish(),
  shippingFee: z.number().min(0).nullish(),
  isFreeShipping: z.boolean().optional().default(false),

  lines: z.array(OrderLineSchema).optional().default([]),
  returnLines: z.array(OrderLineSchema).optional().default([]),

  incomeExpenses: z
    .array(
      z.object({
        fundId: z.uuid().optional(),
        amount: z.number().min(0).optional(),
      }),
    )
    .optional(),
}).refine(
  (data) => {
    if (ReturnOrderTypes.includes(data.type)) {
      return !!data.refOrderId;
    }
    return true;
  },
  {
    message: "Đơn hoàn trả phải có đơn gốc",
    path: ["refOrderId"],
  },
);

export const UpdateOrderSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  partnerId: z.uuid().optional(),
  type: z.enum(OrderType).optional(),

  orderAt: DateTransform.optional(),

  discountType: z.enum(RateType).optional(),
  discountValue: z.number().optional(),

  shipperId: z.uuid().nullish(),
  shippingFee: z.number().min(0).nullish(),
  isFreeShipping: z.boolean().optional(),
  lines: z.array(OrderLineSchema).optional(),
  returnLines: z.array(OrderLineSchema).optional(),
});

// Extend BaseQuerySchema with Order-specific filters
export const OrderQuerySchema = BaseQuerySchema.extend({
  grossAmountGte: z.coerce.number().min(0).optional(),
  grossAmountLte: z.coerce.number().min(0).optional(),
  grossAmountGt: z.coerce.number().min(0).optional(),
  grossAmountLt: z.coerce.number().min(0).optional(),
  grossAmountEq: z.coerce.number().min(0).optional(),

  discountAmountGte: z.coerce.number().min(0).optional(),
  discountAmountLte: z.coerce.number().min(0).optional(),
  discountAmountGt: z.coerce.number().min(0).optional(),
  discountAmountLt: z.coerce.number().min(0).optional(),
  discountAmountEq: z.coerce.number().min(0).optional(),

  netAmountGte: z.coerce.number().min(0).optional(),
  netAmountLte: z.coerce.number().min(0).optional(),
  netAmountGt: z.coerce.number().min(0).optional(),
  netAmountLt: z.coerce.number().min(0).optional(),
  netAmountEq: z.coerce.number().min(0).optional(),

  taxAmountGte: z.coerce.number().min(0).optional(),
  taxAmountLte: z.coerce.number().min(0).optional(),
  taxAmountGt: z.coerce.number().min(0).optional(),
  taxAmountLt: z.coerce.number().min(0).optional(),
  taxAmountEq: z.coerce.number().min(0).optional(),

  totalAmountGte: z.coerce.number().min(0).optional(),
  totalAmountLte: z.coerce.number().min(0).optional(),
  totalAmountGt: z.coerce.number().min(0).optional(),
  totalAmountLt: z.coerce.number().min(0).optional(),
  totalAmountEq: z.coerce.number().min(0).optional(),
});

export const OrderParamsSchema = BaseParamsSchema;

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderSchema>;
export type OrderQueryDto = z.infer<typeof OrderQuerySchema>;
export type OrderParamsDto = z.infer<typeof OrderParamsSchema>;
