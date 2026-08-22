import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { PartnerDebtSideEnum } from "@/shared/constants/enum";
import * as z from "zod";

export const CreatePartnerDebtAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  side: z.enum(PartnerDebtSideEnum),
  occurredAt: DateTransform,
  adjustedById: z.uuid().optional(),
  partnerId: z.uuid(),
  storeId: z.uuid(),
  expectedAmount: z.number().min(0),
  reason: z.string().nullish(),
});

export const UpdatePartnerDebtAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform.optional(),
  adjustedById: z.uuid().nullish(),
  partnerId: z.uuid().optional(),
  storeId: z.uuid(),
  expectedAmount: z.number().min(0).optional(),
  reason: z.string().nullish().optional(),
});

// Extend BaseQuerySchema with PartnerDebtAdjustment-specific filters
export const PartnerDebtAdjustmentQuerySchema = BaseQuerySchema.extend({
  side: z.enum(PartnerDebtSideEnum),
});

export const PartnerDebtAdjustmentParamsSchema = BaseParamsSchema;

export type CreatePartnerDebtAdjustmentDto = z.infer<
  typeof CreatePartnerDebtAdjustmentSchema
>;
export type UpdatePartnerDebtAdjustmentDto = z.infer<
  typeof UpdatePartnerDebtAdjustmentSchema
>;
export type PartnerDebtAdjustmentQueryDto = z.infer<
  typeof PartnerDebtAdjustmentQuerySchema
>;
export type PartnerDebtAdjustmentParamsDto = z.infer<
  typeof PartnerDebtAdjustmentParamsSchema
>;
