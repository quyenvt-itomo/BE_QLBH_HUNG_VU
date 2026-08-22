import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateFundAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform,
  fundId: z.uuid(),
  expectedAmount: z.number(),
  reason: z.string(),
  note: z.string().nullish(),
});

export const UpdateFundAdjustmentSchema = BaseUpdateSchema.extend({
  occurredAt: DateTransform.optional(),
  fundId: z.uuid().optional(),
  expectedAmount: z.number().optional(),
  reason: z.string().optional(),
  note: z.string().nullish(),
});

export const FundAdjustmentQuerySchema = BaseQuerySchema.extend({
  countedAmountGte: z.coerce.number().min(0).optional(),
  countedAmountGt: z.coerce.number().min(0).optional(),
  countedAmountLte: z.coerce.number().min(0).optional(),
  countedAmountLt: z.coerce.number().min(0).optional(),
  countedAmountEq: z.coerce.number().min(0).optional(),

  expectedAmountGte: z.coerce.number().min(0).optional(),
  expectedAmountGt: z.coerce.number().min(0).optional(),
  expectedAmountLte: z.coerce.number().min(0).optional(),
  expectedAmountLt: z.coerce.number().min(0).optional(),
  expectedAmountEq: z.coerce.number().min(0).optional(),

  deltaAmountGte: z.coerce.number().min(0).optional(),
  deltaAmountGt: z.coerce.number().min(0).optional(),
  deltaAmountLte: z.coerce.number().min(0).optional(),
  deltaAmountLt: z.coerce.number().min(0).optional(),
  deltaAmountEq: z.coerce.number().min(0).optional(),
});

export const FundAdjustmentParamsSchema = BaseParamsSchema;

export type CreateFundAdjustmentDto = z.infer<
  typeof CreateFundAdjustmentSchema
>;
export type UpdateFundAdjustmentDto = z.infer<
  typeof UpdateFundAdjustmentSchema
>;
export type FundAdjustmentQueryDto = z.infer<typeof FundAdjustmentQuerySchema>;
export type FundAdjustmentParamsDto = z.infer<
  typeof FundAdjustmentParamsSchema
>;
