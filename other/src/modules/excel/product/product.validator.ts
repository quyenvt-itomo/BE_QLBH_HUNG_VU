import { z } from "zod";
import { ProductKey } from "./product.types";

/**
 * Validator cho Product từ Excel
 * Mềm hơn validator của UI - sử dụng nhiều default
 *
 * Logic:
 * - Mỗi dòng là độc lập
 * - Nếu có SPECIFICATION => tạo/cập nhật variant của product
 * - Nếu không có SPECIFICATION => tạo/cập nhật product (với 1 variant default)
 */
export const ProductRowSchema = z.object({
  _rowNumber: z.number(),

  // Product info (required)
  [ProductKey.CODE]: z.string().optional(),
  [ProductKey.NAME]: z
    .string()
    .trim()
    .min(1, "Tên sản phẩm không được để trống"),
  [ProductKey.CATEGORY_NAME]: z.string().trim().nullish().default(null),
  [ProductKey.UNIT_NAME]: z.string().trim().nullish().default(null),
  [ProductKey.TAX_RATE]: z.number().min(0).max(100).nullish().default(null),

  // Variant fields (optional)
  [ProductKey.SPECIFICATION]: z.string().trim().nullish().default(null),
  [ProductKey.SKU]: z.string().trim().nullish().default(null),
  [ProductKey.BARCODE]: z.string().trim().nullish().default(null),
  [ProductKey.VARIANT_COST_PRICE]: z.number().min(0).nullish().default(null),
  [ProductKey.VARIANT_PRICE]: z.number().min(0).nullish().default(null),
  [ProductKey.INITIAL_STOCK]: z.number().min(0).nullish().default(null),
  [ProductKey.NOTE]: z.string().trim().nullish().default(null),
});

export type ValidatedProductRow = z.infer<typeof ProductRowSchema>;
