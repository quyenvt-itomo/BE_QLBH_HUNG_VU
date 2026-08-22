import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { z } from "zod";
export const CreateFundTransferSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  fromFundId: z.uuid(),
  toFundId: z.uuid(),
  amount: z.number().gt(0, "amount.invalid"),
  occurredAt: DateTransform,
});

export const UpdateFundTransferSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  fromFundId: z.uuid().optional(),
  toFundId: z.uuid().optional(),
  amount: z.number().gt(0, "amount.invalid").optional(),
  occurredAt: DateTransform.optional(),
});

export const FundTransferQuerySchema = BaseQuerySchema.extend({
  amountGte: z.coerce.number().min(0).optional(),
  amountGt: z.coerce.number().min(0).optional(),
  amountLte: z.coerce.number().min(0).optional(),
  amountLt: z.coerce.number().min(0).optional(),
  amountEq: z.coerce.number().min(0).optional(),
});

export const FundTransferParamsSchema = BaseParamsSchema;

export type CreateFundTransferDto = z.infer<typeof CreateFundTransferSchema>;
export type UpdateFundTransferDto = z.infer<typeof UpdateFundTransferSchema>;
export type FundTransferQueryDto = z.infer<typeof FundTransferQuerySchema>;
export type FundTransferParamsDto = z.infer<typeof FundTransferParamsSchema>;
