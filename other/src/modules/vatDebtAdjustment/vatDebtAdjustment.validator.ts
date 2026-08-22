import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateVatDebtAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform,
  adjustedById: z.uuid().optional(),
  storeId: z.uuid(),
  expectedAmount: z.number(),
  reason: z.string().nullish(),
});

export const UpdateVatDebtAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform.optional(),
  adjustedById: z.uuid().nullish(),
  storeId: z.uuid(),
  expectedAmount: z.number().optional(),
  reason: z.string().nullish(),
});

// Extend BaseQuerySchema with VatDebtAdjustment-specific filters
export const VatDebtAdjustmentQuerySchema = BaseQuerySchema;

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
