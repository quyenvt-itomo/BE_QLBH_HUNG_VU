import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { DiscountTypeEnum, OrderLineTypeEnum } from "@/shared/constants/enum";
import * as z from "zod";

export const CreateOrderLineSchema = BaseCreateSchema.extend({
  productVariantId: z.uuid(),
  refOrderLineId: z.uuid().nullish(),
  lineType: z.enum(OrderLineTypeEnum).default(OrderLineTypeEnum.NORMAL),

  unitPrice: z.number().min(0),
  quantity: z.number().min(0),
  discountType: z
    .enum(DiscountTypeEnum)
    .optional()
    .default(DiscountTypeEnum.AMOUNT),
  discountValue: z.number().nullish(),
  taxRate: z.number().nullish(),
}).refine(
  (data) => {
    // If lineType is RETURN, refOrderLineId is required
    if (data.lineType === OrderLineTypeEnum.RETURN) {
      return !!data.refOrderLineId;
    }
    return true;
  },
  {
    message: "Dòng trả hàng phải có refOrderLineId",
    path: ["refOrderLineId"],
  },
);

export const UpdateOrderLineSchema = BaseUpdateSchema.extend({
  unitPrice: z.number().min(0).optional(),
  quantity: z.number().min(0).optional(),
  discountType: z.enum(DiscountTypeEnum).optional(),
  discountValue: z.number().nullish(),
  taxRate: z.number().nullish(),
  sortOrder: z.number().optional(),
});

// Extend BaseQuerySchema with OrderLine-specific filters
export const OrderLineQuerySchema = BaseQuerySchema;

export const OrderLineCreateParamsSchema = z.object({
  orderId: z.uuid(),
});

export const OrderLineParamsSchema = BaseParamsSchema.extend({
  orderId: z.uuid(),
});

export type CreateOrderLineDto = z.infer<typeof CreateOrderLineSchema>;
export type UpdateOrderLineDto = z.infer<typeof UpdateOrderLineSchema>;
export type OrderLineQueryDto = z.infer<typeof OrderLineQuerySchema>;
export type OrderLineParamsDto = z.infer<typeof OrderLineParamsSchema>;
export type OrderLineCreateParamsDto = z.infer<
  typeof OrderLineCreateParamsSchema
>;
