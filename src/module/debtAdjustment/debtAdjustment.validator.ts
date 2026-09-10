import {
  BaseCreateSchema,
  BaseDeleteManySchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
  zArrayable,
} from "@/shared/base/BaseValidator";
import { DebtSide } from "@/shared/constants/enum";
import * as z from "zod";

const amountSchema = z.number().finite().min(0);

export const CreateDebtAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().trim().max(25).optional(),
  occurredAt: DateTransform.optional(),
  side: z.enum(DebtSide),
  partnerId: z.uuid().nullish(),
  expectedAmount: amountSchema,
  countedAmount: amountSchema,
  reason: z.string().trim().nullish(),
  isInitial: z.boolean().optional().default(false),
});

export const UpdateDebtAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().trim().max(25).optional(),
  occurredAt: DateTransform.optional(),
  side: z.enum(DebtSide).optional(),
  partnerId: z.uuid().nullish(),
  expectedAmount: amountSchema.optional(),
  countedAmount: amountSchema.optional(),
  reason: z.string().trim().nullish(),
  isInitial: z.boolean().optional(),
});

export const DebtAdjustmentQuerySchema = BaseQuerySchema.extend({
  side: z.enum(DebtSide).optional(),
  partnerGroupId: z.uuid().optional(),
  partnerGroupIds: zArrayable(z.uuid()),
});

export const DebtAdjustmentParamsSchema = BaseParamsSchema;
export const DebtAdjustmentDeleteManySchema = BaseDeleteManySchema;
export type DebtAdjustmentQuery = z.infer<typeof DebtAdjustmentQuerySchema>;
