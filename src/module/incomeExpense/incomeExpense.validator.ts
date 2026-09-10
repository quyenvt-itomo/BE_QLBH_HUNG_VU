import {
  BaseCreateSchema,
  BaseDeleteManySchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import {
  IncomeExpenseStatus,
  IncomeExpenseType,
} from "@/database/models/store/IncomeExpense";
import * as z from "zod";

const IncomeExpenseFields = {
  occurredAt: DateTransform.optional(),
  code: z.string().trim().max(50).optional(),
  type: z.enum(IncomeExpenseType),
  status: z.enum(IncomeExpenseStatus).optional(),
  fundId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  categoryId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  description: z.string().trim().nullish(),
  amount: z.number().min(0).optional(),
};

export const CreateIncomeExpenseSchema = BaseCreateSchema.extend({
  ...IncomeExpenseFields,
});

export const UpdateIncomeExpenseSchema = BaseUpdateSchema.extend({
  occurredAt: DateTransform.optional(),
  code: z.string().trim().max(50).optional(),
  type: z.enum(IncomeExpenseType).optional(),
  status: z.enum(IncomeExpenseStatus).optional(),
  fundId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  categoryId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  description: z.string().trim().nullish(),
  amount: z.number().min(0).optional(),
});

export const IncomeExpenseQuerySchema = BaseQuerySchema.extend({
  type: z.enum(IncomeExpenseType).optional(),
  status: z.enum(IncomeExpenseStatus).optional(),
  fundId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  partnerId: z.uuid().optional(),
});

export const IncomeExpenseParamsSchema = BaseParamsSchema;
export const IncomeExpenseDeleteManySchema = BaseDeleteManySchema;

export type IncomeExpenseQueryDto = z.infer<typeof IncomeExpenseQuerySchema>;
