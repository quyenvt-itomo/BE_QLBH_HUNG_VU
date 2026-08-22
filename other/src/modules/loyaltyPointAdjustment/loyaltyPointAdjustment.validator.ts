import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { FundTransactionTypeEnum } from "@/shared/constants/enum";
import * as z from "zod";

export const CreateLoyaltyPointAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform,
  partnerId: z.uuid(),
  direction: z.enum(FundTransactionTypeEnum),
  expectedRevenue: z.number().min(0),
  expectedPoints: z.number().min(0),
  reason: z.string(),
});

export const UpdateLoyaltyPointAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform.optional(),
  partnerId: z.uuid().optional(),
  direction: z.enum(FundTransactionTypeEnum).optional(),
  expectedRevenue: z.number().min(0).optional(),
  expectedPoints: z.number().min(0).optional(),
  reason: z.string().optional(),
});

export const LoyaltyPointAdjustmentQuerySchema = BaseQuerySchema;

export const LoyaltyPointAdjustmentParamsSchema = BaseParamsSchema;

export type CreateLoyaltyPointAdjustmentDto = z.infer<
  typeof CreateLoyaltyPointAdjustmentSchema
>;
export type UpdateLoyaltyPointAdjustmentDto = z.infer<
  typeof UpdateLoyaltyPointAdjustmentSchema
>;
export type LoyaltyPointAdjustmentQueryDto = z.infer<
  typeof LoyaltyPointAdjustmentQuerySchema
>;
export type LoyaltyPointAdjustmentParamsDto = z.infer<
  typeof LoyaltyPointAdjustmentParamsSchema
>;
