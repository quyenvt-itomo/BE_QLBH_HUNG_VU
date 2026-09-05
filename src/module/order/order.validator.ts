import { IncomeExpenseType, OrderStatus, OrderType, ReturnOrderTypes } from "@/database/models";
import {
  BaseCreateSchema,
  BaseLineSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
  zArrayable,
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
  invoiceNumber: z.string().trim().max(100).nullish(),
  orderAt: DateTransform.optional(),
  occurredAt: DateTransform.nullish(),
  completeImmediately: z.boolean().optional().default(false),

  partnerId: z.uuid().nullish(),

  discountType: z.enum(RateType).optional().default(RateType.AMOUNT),
  discountValue: z.number().nullish(),

  returnDiscountType: z.enum(RateType).optional().default(RateType.AMOUNT),
  returnDiscountValue: z.number().nullish(),

  taxType: z.enum(RateType).optional().default(RateType.AMOUNT),
  taxValue: z.number().nullish(),

  returnTaxType: z.enum(RateType).optional().default(RateType.AMOUNT),
  returnTaxValue: z.number().nullish(),

  shipperId: z.uuid().nullish(),
  shippingFee: z.number().min(0).nullish(),
  isFreeShipping: z.boolean().optional().default(true),

  lines: z.array(OrderLineSchema).optional().default([]),
  returnLines: z.array(OrderLineSchema).optional().default([]),

  incomeExpenses: z
    .array(
      z.object({
        type: z.enum(IncomeExpenseType).optional(),
        fundId: z.uuid().nullish(),
        amount: z.number().min(0).optional(),
        occurredAt: DateTransform.optional(),
        partnerId: z.uuid().nullish(),
        description: z.string().trim().nullish(),
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
).superRefine((data, context) => {
  const shippingFee = Number(data.shippingFee || 0);
  if (shippingFee <= 0) return;

  const isPurchase =
    data.type === OrderType.PURCHASE || data.type === OrderType.PURCHASE_RETURN;
  if (isPurchase && data.isFreeShipping && !data.shipperId) {
    context.addIssue({
      code: "custom",
      path: ["shipperId"],
      message: "Đơn mua tự thanh toán phí vận chuyển phải chọn đơn vị vận chuyển",
    });
  }
  if (isPurchase && !data.isFreeShipping && data.shipperId) {
    context.addIssue({
      code: "custom",
      path: ["shipperId"],
      message: "Chỉ chọn đơn vị vận chuyển khi đơn mua tự thanh toán phí",
    });
  }
});

export const UpdateOrderSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  invoiceNumber: z.string().trim().max(100).nullish(),
  partnerId: z.uuid().optional(),
  type: z.enum(OrderType).optional(),

  orderAt: DateTransform.optional(),

  discountType: z.enum(RateType).optional(),
  discountValue: z.number().optional(),

  returnDiscountType: z.enum(RateType).optional(),
  returnDiscountValue: z.number().optional(),

  taxType: z.enum(RateType).optional(),
  taxValue: z.number().optional(),

  returnTaxType: z.enum(RateType).optional(),
  returnTaxValue: z.number().optional(),

  shipperId: z.uuid().nullish(),
  shippingFee: z.number().min(0).nullish(),
  isFreeShipping: z.boolean().optional(),
  incomeExpenses: z
    .array(
      z.object({
        type: z.enum(IncomeExpenseType).optional(),
        fundId: z.uuid().nullish(),
        amount: z.number().min(0).optional(),
        occurredAt: DateTransform.optional(),
        partnerId: z.uuid().nullish(),
        description: z.string().trim().nullish(),
      }),
    )
    .optional(),
  lines: z.array(OrderLineSchema).optional(),
  returnLines: z.array(OrderLineSchema).optional(),
});

// Extend BaseQuerySchema with Order-specific filters
export const OrderQuerySchema = BaseQuerySchema.extend({
  statuses: zArrayable(z.enum(OrderStatus)),
  completerIds: zArrayable(z.uuid()),
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
