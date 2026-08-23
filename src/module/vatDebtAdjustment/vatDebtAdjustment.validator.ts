import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { TransactionType } from "@/shared/constants/enum";

export const CreateVatDebtAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(25),
  occurredAt: DateTransform,
  adjustedById: z.uuid().nullish(),
  expectedAmount: z.number().min(0),
  countedAmount: z.number().min(0),
  deltaAmount: z.number(),
  type: z.enum(TransactionType),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional().default(false),
});

export const UpdateVatDebtAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(25).optional(),
  occurredAt: DateTransform.optional(),
  adjustedById: z.uuid().nullish(),
  expectedAmount: z.number().min(0).optional(),
  countedAmount: z.number().min(0).optional(),
  deltaAmount: z.number().optional(),
  type: z.enum(TransactionType).optional(),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional(),
});

export const VatDebtAdjustmentQuerySchema = BaseQuerySchema.extend({
  adjustedById: z.uuid().optional(),
  type: z.enum(TransactionType).optional(),
  isInitial: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export const VatDebtAdjustmentParamsSchema = BaseParamsSchema;

export type CreateVatDebtAdjustmentDto = z.infer<
  typeof CreateVatDebtAdjustmentSchema
>;
export type UpdateVatDebtAdjustmentDto = z.infer<
  typeof UpdateVatDebtAdjustmentSchema
>;
export type VatDebtAdjustmentQueryDto = z.infer<
  typeof VatDebtAdjustmentQuerySchema
>;
export type VatDebtAdjustmentParamsDto = z.infer<
  typeof VatDebtAdjustmentParamsSchema
>;
