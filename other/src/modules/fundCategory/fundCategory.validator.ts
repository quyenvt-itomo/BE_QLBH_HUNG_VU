import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateFundCategorySchema = BaseCreateSchema.extend({
  fundCategoryGroupId: z.string(),
  name: z.string().max(255),
});
export const UpdateFundCategorySchema = BaseUpdateSchema.extend({
  name: z.string().max(255).optional(),
});

export const FundCategoryQuerySchema = BaseQuerySchema;

export const FundCategoryParamsSchema = BaseParamsSchema;

export type CreateFundCategoryDto = z.infer<typeof CreateFundCategorySchema>;
export type UpdateFundCategoryDto = z.infer<typeof UpdateFundCategorySchema>;
export type FundCategoryQueryDto = z.infer<typeof FundCategoryQuerySchema>;
export type FundCategoryParamsDto = z.infer<typeof FundCategoryParamsSchema>;
