import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { IncomeExpenseTypeEnum } from "@/shared/constants/enum";
import { z } from "zod";
export const CreateIncomeExpenseSchema = BaseCreateSchema.extend({
  occurredAt: DateTransform,
  code: z.string().optional(),
  type: z.enum(IncomeExpenseTypeEnum),
  storeId: z.uuid(),
  creatorId: z.uuid().nullish(),
  fundId: z.uuid(),
  amount: z.number().min(0),
  categoryId: z.uuid().optional(),
  partnerId: z.uuid().nullish(),
  orderId: z.uuid().optional(),
  description: z.string().nullish(),
});
export const UpdateIncomeExpenseSchema = BaseUpdateSchema.extend({
  occurredAt: DateTransform.optional(),
  code: z.string().optional(),
  storeId: z.uuid().optional(),
  creatorId: z.uuid().nullish(),
  fundId: z.uuid().optional(),
  amount: z.number().min(0).optional(),
  categoryId: z.uuid().optional(),
  partnerId: z.uuid().nullish(),
  description: z.string().nullish(),
});

export const IncomeExpenseQuerySchema = BaseQuerySchema.extend({
  type: z.enum(IncomeExpenseTypeEnum).optional(),
  categoryId: z.uuid().optional(),
  fundCategoryGroupId: z.uuid().optional(),
  amountGte: z.coerce.number().min(0).optional(),
  amountGt: z.coerce.number().min(0).optional(),
  amountLte: z.coerce.number().min(0).optional(),
  amountLt: z.coerce.number().min(0).optional(),
  amountEq: z.coerce.number().min(0).optional(),
});

export const IncomeExpenseParamsSchema = BaseParamsSchema;

export type CreateIncomeExpenseDto = z.infer<typeof CreateIncomeExpenseSchema>;
export type UpdateIncomeExpenseDto = z.infer<typeof UpdateIncomeExpenseSchema>;
export type IncomeExpenseQueryDto = z.infer<typeof IncomeExpenseQuerySchema>;
export type IncomeExpenseParamsDto = z.infer<typeof IncomeExpenseParamsSchema>;
