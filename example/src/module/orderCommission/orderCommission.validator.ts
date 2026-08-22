import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateOrderCommissionSchema = BaseCreateSchema.extend({
  orderId: z.uuid(),
  partnerContactId: z.uuid().nullish(),
  totalAmount: z.number().min(0),
});

export const UpdateOrderCommissionSchema = BaseUpdateSchema.extend({
  partnerContactId: z.uuid().nullish(),
  totalAmount: z.number().min(0).optional(),
});

export const OrderCommissionQuerySchema = BaseQuerySchema.extend({
  orderId: z.uuid().optional(),
  partnerContactId: z.uuid().optional(),
});

export const OrderCommissionParamsSchema = BaseParamsSchema;

export type CreateOrderCommissionDto = z.infer<
  typeof CreateOrderCommissionSchema
>;
export type UpdateOrderCommissionDto = z.infer<
  typeof UpdateOrderCommissionSchema
>;
export type OrderCommissionQueryDto = z.infer<
  typeof OrderCommissionQuerySchema
>;
export type OrderCommissionParamsDto = z.infer<
  typeof OrderCommissionParamsSchema
>;
