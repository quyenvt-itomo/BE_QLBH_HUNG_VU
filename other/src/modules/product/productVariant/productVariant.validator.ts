import {
  BaseParamsSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const UpdateProductVariantSchema = BaseUpdateSchema.extend({
  sku: z.string().max(255).optional(),
  barcode: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const ProductVariantParamsSchema = BaseParamsSchema.extend({
  productId: z.uuid(),
});

export type UpdateProductVariantDto = z.infer<
  typeof UpdateProductVariantSchema
>;
export type ProductVariantParamsDto = z.infer<
  typeof ProductVariantParamsSchema
>;
