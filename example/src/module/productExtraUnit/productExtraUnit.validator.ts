import { z } from "zod";
import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";

export const CreateProductExtraUnitSchema = BaseCreateSchema.extend({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  conversionRate: z.number().positive(),
  pricePerUnit: z.number().min(0).default(0),
});

export const UpdateProductExtraUnitSchema = BaseUpdateSchema.extend({
  unitId: z.string().uuid().optional(),
  conversionRate: z.number().positive().optional(),
  pricePerUnit: z.number().min(0).optional(),
});

export const ProductExtraUnitQuerySchema = BaseQuerySchema.extend({
  productId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export const ProductExtraUnitParamsSchema = BaseParamsSchema;

export type CreateProductExtraUnitDto = z.infer<
  typeof CreateProductExtraUnitSchema
>;
export type UpdateProductExtraUnitDto = z.infer<
  typeof UpdateProductExtraUnitSchema
>;
export type ProductExtraUnitQueryDto = z.infer<
  typeof ProductExtraUnitQuerySchema
>;
