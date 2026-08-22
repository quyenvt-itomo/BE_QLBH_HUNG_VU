import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  zBooleanLike,
  BaseCodeSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ProductType } from "@/database/models/company/Product";

export const ExtraUnitSchema = z.object({
  id: z.uuid().optional(),
  unitId: z.uuid(),
  conversionRate: z.number().positive(),
  pricePerUnit: z.number().min(0),
});

export const CreateProductSchema = BaseCreateSchema.extend({
  type: z.enum(ProductType),
  groupId: z.uuid().nullish(),
  code: BaseCodeSchema.optional(),
  name: z.string().trim().nonempty(),
  baseUnitId: z.uuid().nullish(),
  price: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  isPublic: z.boolean().default(false),
  extraUnits: z.array(ExtraUnitSchema).optional().default([]),
});

export const UpdateProductSchema = BaseUpdateSchema.extend({
  type: z.enum(ProductType).optional(),
  groupId: z.uuid().nullish(),
  code: BaseCodeSchema.optional(),
  name: z.string().trim().nonempty().optional(),
  baseUnitId: z.uuid().nullish(),
  price: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  isPublic: z.boolean().optional(),
  extraUnits: z.array(ExtraUnitSchema).optional(),
});

export const ProductQuerySchema = BaseQuerySchema.extend({
  type: z.enum(ProductType).optional(),
  types: z.array(z.enum(ProductType)).optional(),
  groupId: z.uuid().optional(),
  isPublic: zBooleanLike().optional(),
});

export const ProductParamsSchema = BaseParamsSchema;

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductQueryDto = z.infer<typeof ProductQuerySchema>;
export type ProductParamsDto = z.infer<typeof ProductParamsSchema>;
