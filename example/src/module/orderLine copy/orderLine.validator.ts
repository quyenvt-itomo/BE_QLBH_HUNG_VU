import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { SaleLineTypeEnum } from "@/shared/constants/enum";

export const CreateOrderLineSchema = BaseCreateSchema.extend({
  orderId: z.uuid(),
  type: z.enum(SaleLineTypeEnum),
  productId: z.uuid().nullish(),
  serviceId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
});

export const UpdateOrderLineSchema = BaseUpdateSchema.extend({
  orderId: z.uuid().optional(),
  type: z.enum(SaleLineTypeEnum).optional(),
  productId: z.uuid().nullish(),
  serviceId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
});

export const OrderLineQuerySchema = BaseQuerySchema.extend({
  orderId: z.uuid().optional(),
  type: z.enum(SaleLineTypeEnum).optional(),
  productId: z.uuid().optional(),
});

export const OrderLineParamsSchema = BaseParamsSchema;

export type CreateOrderLineDto = z.infer<typeof CreateOrderLineSchema>;
export type UpdateOrderLineDto = z.infer<typeof UpdateOrderLineSchema>;
export type OrderLineQueryDto = z.infer<typeof OrderLineQuerySchema>;
export type OrderLineParamsDto = z.infer<typeof OrderLineParamsSchema>;
