import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ApproveStatus } from "@/shared/constants/enum";

export const CreateShippingPlanSchema = BaseCreateSchema.extend({
  plannedAt: z.string().datetime().optional(),
  orderId: z.uuid().nullish(),
  purchaseId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  partnerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  subTotal: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).default(0),
  taxAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
});

export const UpdateShippingPlanSchema = BaseUpdateSchema.extend({
  plannedAt: z.string().datetime().optional(),
  partnerId: z.uuid().nullish(),
  partnerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  unitPrice: z.number().min(0).optional(),
  quantity: z.number().positive().optional(),
  subTotal: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
});

export const RejectShippingPlanSchema = z.object({
  rejectReason: z.string().min(1),
});

export const ShippingPlanQuerySchema = BaseQuerySchema.extend({
  orderId: z.uuid().optional(),
  purchaseId: z.uuid().optional(),
  partnerId: z.uuid().optional(),
  approveStatus: z.enum(ApproveStatus).optional(),
});

export const ShippingPlanParamsSchema = BaseParamsSchema;

export type CreateShippingPlanDto = z.infer<typeof CreateShippingPlanSchema>;
export type UpdateShippingPlanDto = z.infer<typeof UpdateShippingPlanSchema>;
export type RejectShippingPlanDto = z.infer<typeof RejectShippingPlanSchema>;
export type ShippingPlanQueryDto = z.infer<typeof ShippingPlanQuerySchema>;
export type ShippingPlanParamsDto = z.infer<typeof ShippingPlanParamsSchema>;
