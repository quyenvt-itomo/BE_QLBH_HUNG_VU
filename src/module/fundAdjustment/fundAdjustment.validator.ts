import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { TransactionType } from "@/shared/constants/enum";

export const CreateFundAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().min(1),
  occurredAt: DateTransform,
  fundId: z.uuid().nullish(),
  expectedAmount: z.number().min(0),
  countedAmount: z.number().min(0),
  deltaAmount: z.number(),
  type: z.enum(TransactionType),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional().default(false),
});

export const UpdateFundAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).optional(),
  occurredAt: DateTransform.optional(),
  fundId: z.uuid().nullish(),
  expectedAmount: z.number().min(0).optional(),
  countedAmount: z.number().min(0).optional(),
  deltaAmount: z.number().optional(),
  type: z.enum(TransactionType).optional(),
  reason: z.string().nullish(),
  isInitial: z.boolean().optional(),
});

export const FundAdjustmentQuerySchema = BaseQuerySchema.extend({
  fundId: z.uuid().optional(),
  type: z.enum(TransactionType).optional(),
  isInitial: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
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
