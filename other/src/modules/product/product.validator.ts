import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { CreateProductOptionSchema } from "./productOption";

export const CreateProductSchema = BaseCreateSchema.extend({
  name: z.string().nonempty(),
  code: z.string().optional(),
  tempId: z.uuid(),

  categoryId: z.uuid(),
  unitId: z.uuid(),

  taxRate: z.number().min(0).max(100).optional(),

  hasVariant: z.boolean().optional().default(false),

  options: z
    .array(
      CreateProductOptionSchema.extend({
        tempId: z.uuid(),
      }),
    )
    .optional()
    .default([]),

  variants: z
    .array(
      z.object({
        tempId: z.uuid().optional(),
        options: z
          .array(
            z.object({
              tempId: z.uuid(),
            }),
          )
          .optional(),
        sku: z.string().max(255).optional(),
        barcode: z.string().optional(),
        costPrice: z.number().min(0).optional(),
        price: z.number().min(0).optional(),
        isActive: z.boolean().optional().default(true),
      }),
    )
    .min(1),
});

export const UpdateProductSchema = BaseUpdateSchema.extend({
  name: z.string().nonempty().optional(),
  code: z.string().optional(),
  categoryId: z.uuid().optional(),
  unitId: z.uuid().optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

// Extend BaseQuerySchema with Product-specific filters
export const ProductQuerySchema = BaseQuerySchema.extend({
  taxRateGte: z.coerce.number().min(0).optional(),
  taxRateLte: z.coerce.number().min(0).optional(),
  taxRateGt: z.coerce.number().min(0).optional(),
  taxRateLt: z.coerce.number().min(0).optional(),
  taxRateEq: z.coerce.number().min(0).optional(),

  costPriceGte: z.coerce.number().min(0).optional(),
  costPriceLte: z.coerce.number().min(0).optional(),
  costPriceGt: z.coerce.number().min(0).optional(),
  costPriceLt: z.coerce.number().min(0).optional(),
  costPriceEq: z.coerce.number().min(0).optional(),

  priceGte: z.coerce.number().min(0).optional(),
  priceLte: z.coerce.number().min(0).optional(),
  priceGt: z.coerce.number().min(0).optional(),
  priceLt: z.coerce.number().min(0).optional(),
  priceEq: z.coerce.number().min(0).optional(),

  totalStockQtyGte: z.coerce.number().min(0).optional(),
  totalStockQtyLte: z.coerce.number().min(0).optional(),
  totalStockQtyGt: z.coerce.number().min(0).optional(),
  totalStockQtyLt: z.coerce.number().min(0).optional(),
  totalStockQtyEq: z.coerce.number().min(0).optional(),

  totalStockValueGte: z.coerce.number().min(0).optional(),
  totalStockValueLte: z.coerce.number().min(0).optional(),
  totalStockValueGt: z.coerce.number().min(0).optional(),
  totalStockValueLt: z.coerce.number().min(0).optional(),
  totalStockValueEq: z.coerce.number().min(0).optional(),
});

export const GetByBarcodeSchema = z.object({
  barcode: z.string(),
});

export const ProductParamsSchema = BaseParamsSchema;

export const ProductChildParamsSchema = z.object({
  productId: z.uuid(),
});

// Export Query Schema - loại trừ page, size, keyword cho export Excel
export const ProductExportQuerySchema = ProductQuerySchema.omit({
  page: true,
  size: true,
  keyword: true,
});

export const ProductDeleteManyQuery = z.object({
  ids: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductQueryDto = z.infer<typeof ProductQuerySchema>;
export type GetByBarcodeDto = z.infer<typeof GetByBarcodeSchema>;
export type ProductParamsDto = z.infer<typeof ProductParamsSchema>;
export type ProductChildParamsDto = z.infer<typeof ProductChildParamsSchema>;
export type ProductExportQueryDto = z.infer<typeof ProductExportQuerySchema>;
export type ProductDeleteManyQueryDto = z.infer<typeof ProductDeleteManyQuery>;
