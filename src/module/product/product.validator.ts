import * as z from "zod";
import {
  BaseCodeSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  BaseDeleteManySchema,
  zArrayable,
} from "@/shared/base/BaseValidator";
import { WeightUnit } from "@/database/models/Product";

export const ExtraUnitSchema = z.object({
  id: z.uuid().optional(),
  unitId: z.uuid(),
  conversionRate: z.number().positive(),
  salePrice: z.number().min(0),
  isPurchaseUnit: z.boolean().optional().default(false),
});

export const StoreProductSchema = z.object({
  id: z.uuid().optional(),
  storeId: z.uuid(),
  costPrice: z.number().min(0).default(0),
  isSelling: z.boolean().default(true),
  locationIds: z.array(z.uuid()).optional(),
});

export const CreateProductSchema = BaseCreateSchema.extend({
  groupId: z.uuid().nullish(),
  brandId: z.uuid().nullish(),
  code: BaseCodeSchema.optional(),
  barcode: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1),
  description: z.string().nullish(),
  baseUnitId: z.uuid().nullish(),
  salePrice: z.number().min(0).default(0),
  weight: z.number().min(0).nullish(),
  weightUnit: z.enum(WeightUnit).optional(),
  extraUnits: z.array(ExtraUnitSchema).optional().default([]),
  storeProducts: z.array(StoreProductSchema).optional().default([]),
});

export const UpdateProductSchema = BaseUpdateSchema.extend({
  groupId: z.uuid().nullish(),
  brandId: z.uuid().nullish(),
  code: BaseCodeSchema.optional(),
  barcode: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1).optional(),
  description: z.string().nullish(),
  baseUnitId: z.uuid().nullish(),
  salePrice: z.number().min(0).optional(),
  weight: z.number().min(0).nullish(),
  weightUnit: z.enum(WeightUnit).optional(),
  extraUnits: z.array(ExtraUnitSchema).optional(),
  storeProducts: z.array(StoreProductSchema).optional(),
});

export const ProductQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid().optional(),
  groupId: z.uuid().optional(),
  brandId: z.uuid().optional(),
  locationId: z.uuid().optional(),
});
export const ProductByCodesSchema = z.object({
  codes: z.array(z.string().trim().min(1)).min(1).max(500),
});
export const ProductParamsSchema = BaseParamsSchema;
export const ChangeProductGroupSchema = BaseDeleteManySchema.extend({
  groupId: z.uuid().nullable().optional(),
});

export const StopSellingProductsSchema = BaseDeleteManySchema.extend({
  storeId: z.uuid().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductQueryDto = z.infer<typeof ProductQuerySchema>;
export type ProductByCodesDto = z.infer<typeof ProductByCodesSchema>;
export type ProductParamsDto = z.infer<typeof ProductParamsSchema>;
export type ChangeProductGroupDto = z.infer<typeof ChangeProductGroupSchema>;
export type StopSellingProductsDto = z.infer<typeof StopSellingProductsSchema>;
