import {
  BaseCreateSchema,
  BaseDeleteManySchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

const amountSchema = z.number().finite().min(0);

export const CreateVatAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().trim().max(25).optional(),
  occurredAt: DateTransform.optional(),
  expectedAmount: amountSchema,
  countedAmount: amountSchema,
  reason: z.string().trim().nullish(),
  isInitial: z.boolean().optional().default(false),
});

export const UpdateVatAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().trim().max(25).optional(),
  occurredAt: DateTransform.optional(),
  expectedAmount: amountSchema.optional(),
  countedAmount: amountSchema.optional(),
  reason: z.string().trim().nullish(),
  isInitial: z.boolean().optional(),
});

export const VatAdjustmentQuerySchema = BaseQuerySchema;
export const VatAdjustmentParamsSchema = BaseParamsSchema;
export const VatAdjustmentDeleteManySchema = BaseDeleteManySchema;
