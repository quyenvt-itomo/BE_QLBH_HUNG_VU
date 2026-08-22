import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import { FundTypeEnum } from "@/database/models/company/Fund";

export const CreateFundSchema = BaseCreateSchema.extend({
  code: z.string().min(1).max(25),
  name: z.string().min(1).max(255),
  type: z.enum(FundTypeEnum),
  storeId: z.uuid().nullish(),
  bankAccount: z.any().nullish(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateFundSchema = BaseUpdateSchema.extend({
  code: z.string().min(1).max(25).optional(),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(FundTypeEnum).optional(),
  storeId: z.uuid().nullish(),
  bankAccount: z.any().nullish(),
  isActive: z.boolean().optional(),
});

export const FundQuerySchema = BaseQuerySchema.extend({
  type: z.enum(FundTypeEnum).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export const FundParamsSchema = BaseParamsSchema;

export type CreateFundDto = z.infer<typeof CreateFundSchema>;
export type UpdateFundDto = z.infer<typeof UpdateFundSchema>;
export type FundQueryDto = z.infer<typeof FundQuerySchema>;
