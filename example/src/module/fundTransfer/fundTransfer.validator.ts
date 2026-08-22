import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";

export const CreateFundTransferSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(20),
  occurredAt: DateTransform,
  fromFundId: z.uuid().nullish(),
  toFundId: z.uuid(),
  amount: z.number().positive(),
  reason: z.string().nullish(),
});

export const UpdateFundTransferSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(20).optional(),
  occurredAt: DateTransform.optional(),
  fromFundId: z.uuid().nullish(),
  toFundId: z.uuid().optional(),
  amount: z.number().positive().optional(),
  reason: z.string().nullish(),
});

export const FundTransferQuerySchema = BaseQuerySchema.extend({
  fromFundId: z.uuid().optional(),
  toFundId: z.uuid().optional(),
});

export const FundTransferParamsSchema = BaseParamsSchema;

export type CreateFundTransferDto = z.infer<typeof CreateFundTransferSchema>;
export type UpdateFundTransferDto = z.infer<typeof UpdateFundTransferSchema>;
export type FundTransferQueryDto = z.infer<typeof FundTransferQuerySchema>;
export type FundTransferParamsDto = z.infer<typeof FundTransferParamsSchema>;
