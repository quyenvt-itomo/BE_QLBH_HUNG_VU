import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { FundTypeEnum } from "@/shared/constants/enum";
import { z } from "zod";

export const CreateFundSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  storeId: z.uuid(),
  name: z.string().max(255),
  type: z.enum(FundTypeEnum),
  bank: z.string().max(255).nullish(),
  accountNumber: z.string().max(100).nullish(),
  accountHolderName: z.string().max(100).nullish(),
  branch: z.string().max(50).nullish(),
  initialBalance: z.number().optional(),
});

export const UpdateFundSchema = BaseUpdateSchema.extend({
  name: z.string().max(255).optional(),
  type: z.enum(FundTypeEnum).optional(),
  bank: z.string().max(255).nullish(),
  accountNumber: z.string().max(100).nullish(),
  accountHolderName: z.string().max(100).nullish(),
  branch: z.string().max(50).nullish(),
  isDefault: z.boolean().optional(),
});

export const FundQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid().optional(),
  type: z.enum(FundTypeEnum).optional(),
});

export const FundParamsSchema = BaseParamsSchema;

export type CreateFundDto = z.infer<typeof CreateFundSchema>;
export type UpdateFundDto = z.infer<typeof UpdateFundSchema>;
export type FundQueryDto = z.infer<typeof FundQuerySchema>;
export type FundParamsDto = z.infer<typeof FundParamsSchema>;
