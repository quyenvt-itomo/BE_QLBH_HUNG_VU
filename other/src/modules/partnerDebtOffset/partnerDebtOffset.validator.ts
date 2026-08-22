import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreatePartnerDebtOffsetSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform,
  storeId: z.uuid(),
  partnerId: z.uuid(),
  offsetById: z.uuid().optional(),
  offsetAmount: z.number().min(0),
  reason: z.string().nullish(),
});

export const UpdatePartnerDebtOffsetSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform.optional(),
  storeId: z.uuid(),
  partnerId: z.uuid().optional(),
  offsetById: z.uuid().nullish(),
  offsetAmount: z.number().min(0).optional(),
  reason: z.string().nullish(),
});

// Extend BaseQuerySchema with PartnerDebtOffset-specific filters
export const PartnerDebtOffsetQuerySchema = BaseQuerySchema;

export const PartnerDebtOffsetParamsSchema = BaseParamsSchema;

export type CreatePartnerDebtOffsetDto = z.infer<
  typeof CreatePartnerDebtOffsetSchema
>;
export type UpdatePartnerDebtOffsetDto = z.infer<
  typeof UpdatePartnerDebtOffsetSchema
>;
export type PartnerDebtOffsetQueryDto = z.infer<
  typeof PartnerDebtOffsetQuerySchema
>;
export type PartnerDebtOffsetParamsDto = z.infer<
  typeof PartnerDebtOffsetParamsSchema
>;
