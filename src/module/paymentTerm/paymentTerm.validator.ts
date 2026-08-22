import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";

export const CreatePaymentTermSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  depositRate: z.number().min(0).max(100).default(0),
  maxDebtDays: z.number().int().min(0).default(0),
  maxDebtAmount: z.number().min(0).default(0),
});

export const UpdatePaymentTermSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(255).optional(),
  depositRate: z.number().min(0).max(100).optional(),
  maxDebtDays: z.number().int().min(0).optional(),
  maxDebtAmount: z.number().min(0).optional(),
});

export const PaymentTermQuerySchema = BaseQuerySchema;
export const PaymentTermParamsSchema = BaseParamsSchema;

export type CreatePaymentTermDto = z.infer<typeof CreatePaymentTermSchema>;
export type UpdatePaymentTermDto = z.infer<typeof UpdatePaymentTermSchema>;
export type PaymentTermQueryDto = z.infer<typeof PaymentTermQuerySchema>;
