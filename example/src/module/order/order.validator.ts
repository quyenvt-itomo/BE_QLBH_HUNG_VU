import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  zBooleanLike,
  BaseLineSchema,
  AdditionalInfoSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { SaleLineTypeEnum } from "@/shared/constants/enum";

export const OrderLineSchema = BaseLineSchema.extend({
  type: z
    .enum([SaleLineTypeEnum.PRODUCT, SaleLineTypeEnum.SERVICE])
    .default(SaleLineTypeEnum.PRODUCT),
  productId: z.uuid().nullish(),
  serviceId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  subTotal: z.number().min(0),
  taxAmount: z.number().min(0),
  grossAmount: z.number().min(0),
  commissionAmount: z.number().min(0).default(0),
});

export const OrderCommissionSchema = z.object({
  id: z.uuid().optional(),
  partnerContactId: z.uuid(),
  totalAmount: z.number().min(0),
});

export const CreateOrderSchema = BaseCreateSchema.extend({
  timeAt: DateTransform.optional(),
  quotationId: z.uuid().nullish(),
  customerId: z.uuid().nullish(),
  customerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  staffId: z.uuid().nullish(),
  meshSpecId: z.uuid().nullish(),
  additionalInfo: z.array(AdditionalInfoSchema).optional().default([]),
  lines: z.array(OrderLineSchema).default([]),
  commissions: z.array(OrderCommissionSchema).optional().default([]),
});

export const UpdateOrderSchema = BaseUpdateSchema.extend({
  timeAt: DateTransform.optional(),
  customerId: z.uuid().nullish(),
  customerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  staffId: z.uuid().nullish(),
  meshSpecId: z.uuid().nullish(),
  additionalInfo: z.array(AdditionalInfoSchema).optional(),
  lines: z.array(OrderLineSchema).optional(),
  commissions: z.array(OrderCommissionSchema).optional(),
});

export const OrderQuerySchema = BaseQuerySchema.extend({
  customerId: z.uuid().optional(),
  staffId: z.uuid().optional(),
  isCompleted: zBooleanLike().optional(),
  quotationId: z.uuid().optional(),
});

export const OrderParamsSchema = BaseParamsSchema;

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderSchema>;
export type OrderQueryDto = z.infer<typeof OrderQuerySchema>;
export type OrderParamsDto = z.infer<typeof OrderParamsSchema>;
