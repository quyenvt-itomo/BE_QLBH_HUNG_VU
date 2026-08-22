import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { CreateOrderLineSchema } from "./orderLine";
import {
  DiscountTypeEnum,
  OrderTypeEnum,
  OrderLineTypeEnum,
  OrderStatusEnum,
} from "@/shared/constants/enum";

export const CreateOrderSchema = BaseCreateSchema.extend({
  storeId: z.uuid(),
  refOrderId: z.uuid().nullish(),
  type: z.enum(OrderTypeEnum),
  code: z.string().optional(),
  partnerId: z.uuid().nullish(),
  employeeId: z.uuid().nullish(),

  orderAt: DateTransform.optional().default(() => new Date()),

  discountType: z
    .enum(DiscountTypeEnum)
    .optional()
    .default(DiscountTypeEnum.AMOUNT),
  discountValue: z.number().nullish(),

  shippingProviderId: z.uuid().nullish(),
  shippingFee: z.number().min(0).nullish(),
  isFreeShipping: z.boolean().optional().default(false),

  // Loyalty points fields
  pointEarnRate: z.number().min(0).optional().default(100000), // VNĐ/điểm
  pointRedeemRate: z.number().min(0).optional().default(1000), // VNĐ/điểm
  loyaltyPointsUsed: z.number().min(0).optional().default(0),

  lines: z.array(CreateOrderLineSchema).min(1),

  payments: z
    .array(
      z.object({
        fundId: z.uuid().optional(),
        amount: z.number().min(0).optional(),
      }),
    )
    .optional(),
})
  // Nếu là đơn hoàn trả, phải có refOrderId
  .refine(
    (data) => {
      if (
        data.type === OrderTypeEnum.PURCHASE_RETURN ||
        data.type === OrderTypeEnum.SALE_RETURN
      ) {
        return !!data.refOrderId;
      }
      return true;
    },
    {
      message: "Đơn hoàn trả phải có đơn gốc (refOrderId)",
      path: ["refOrderId"],
    },
  );

export const UpdateOrderSchema = BaseUpdateSchema.extend({
  storeId: z.uuid(),
  code: z.string().optional(),
  partnerId: z.uuid().optional(),
  employeeId: z.uuid().nullish(),

  orderAt: DateTransform.optional(),

  discountType: z.enum(DiscountTypeEnum).optional(),
  discountValue: z.number().optional(),

  shippingProviderId: z.uuid().nullish(),
  shippingFee: z.number().min(0).nullish(),
  isFreeShipping: z.boolean().optional(),
  loyaltyPointsUsed: z.number().min(0).optional(),

  status: z.enum(OrderStatusEnum).optional(),
});

// Extend BaseQuerySchema with Order-specific filters
export const OrderQuerySchema = BaseQuerySchema.extend({
  status: z.enum(OrderStatusEnum).optional().default(OrderStatusEnum.POSTED),

  grossAmountGte: z.coerce.number().min(0).optional(),
  grossAmountLte: z.coerce.number().min(0).optional(),
  grossAmountGt: z.coerce.number().min(0).optional(),
  grossAmountLt: z.coerce.number().min(0).optional(),
  grossAmountEq: z.coerce.number().min(0).optional(),

  lineDiscountAmountGte: z.coerce.number().min(0).optional(),
  lineDiscountAmountLte: z.coerce.number().min(0).optional(),
  lineDiscountAmountGt: z.coerce.number().min(0).optional(),
  lineDiscountAmountLt: z.coerce.number().min(0).optional(),
  lineDiscountAmountEq: z.coerce.number().min(0).optional(),

  orderDiscountAmountGte: z.coerce.number().min(0).optional(),
  orderDiscountAmountLte: z.coerce.number().min(0).optional(),
  orderDiscountAmountGt: z.coerce.number().min(0).optional(),
  orderDiscountAmountLt: z.coerce.number().min(0).optional(),
  orderDiscountAmountEq: z.coerce.number().min(0).optional(),

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
