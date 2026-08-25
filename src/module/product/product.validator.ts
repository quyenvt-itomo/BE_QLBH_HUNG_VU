import * as z from "zod";
import {
  BaseCodeSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  zArrayable,
} from "@/shared/base/BaseValidator";

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
  extraUnits: z.array(ExtraUnitSchema).optional(),
  storeProducts: z.array(StoreProductSchema).optional(),
});

export const ProductQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid().optional(),
  groupId: z.uuid().optional(),
  productCategoryIds: zArrayable(z.uuid()),
});
export const ProductParamsSchema = BaseParamsSchema;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductQueryDto = z.infer<typeof ProductQuerySchema>;
export type ProductParamsDto = z.infer<typeof ProductParamsSchema>;
