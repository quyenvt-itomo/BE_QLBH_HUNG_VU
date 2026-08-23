import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { TransactionType } from "@/shared/constants/enum";

export const CreateCommissionDebtAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(25),
  occurredAt: DateTransform.optional(),
  partnerContactId: z.uuid(),
  expectedAmount: z.number().min(0),
  countedAmount: z.number().min(0),
  deltaAmount: z.number(),
  type: z.enum(TransactionType),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional().default(false),
});

export const UpdateCommissionDebtAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(25).optional(),
  occurredAt: DateTransform.optional(),
  partnerContactId: z.uuid().optional(),
  expectedAmount: z.number().min(0).optional(),
  countedAmount: z.number().min(0).optional(),
  deltaAmount: z.number().optional(),
  type: z.enum(TransactionType).optional(),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional(),
});

export const CommissionDebtAdjustmentQuerySchema = BaseQuerySchema.extend({
  partnerContactId: z.uuid().optional(),
  type: z.enum(TransactionType).optional(),
  isInitial: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export const CommissionDebtAdjustmentParamsSchema = BaseParamsSchema;

export type CreateCommissionDebtAdjustmentDto = z.infer<
  typeof CreateCommissionDebtAdjustmentSchema
>;
export type UpdateCommissionDebtAdjustmentDto = z.infer<
  typeof UpdateCommissionDebtAdjustmentSchema
>;
export type CommissionDebtAdjustmentQueryDto = z.infer<
  typeof CommissionDebtAdjustmentQuerySchema
>;
export type CommissionDebtAdjustmentParamsDto = z.infer<
  typeof CommissionDebtAdjustmentParamsSchema
>;
