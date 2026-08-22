import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

/**
 * Query schema cho getStockReport
 * Báo cáo tồn kho theo product/variant
 */
export const GetStockReportQuerySchema = BaseQuerySchema.extend({
  // Override để make required
  startAt: DateTransform,
  endAt: DateTransform,
  productCategoryIds: z.array(z.uuid()).optional(),

  closingQtyGte: z.coerce.number().min(0).optional(),
  closingQtyLte: z.coerce.number().min(0).optional(),
  closingQtyGt: z.coerce.number().min(0).optional(),
  closingQtyLt: z.coerce.number().min(0).optional(),
  closingQtyEq: z.coerce.number().min(0).optional(),

  closingAmountGte: z.coerce.number().min(0).optional(),
  closingAmountLte: z.coerce.number().min(0).optional(),
  closingAmountGt: z.coerce.number().min(0).optional(),
  closingAmountLt: z.coerce.number().min(0).optional(),
  closingAmountEq: z.coerce.number().min(0).optional(),

  openingQtyGte: z.coerce.number().min(0).optional(),
  openingQtyLte: z.coerce.number().min(0).optional(),
  openingQtyGt: z.coerce.number().min(0).optional(),
  openingQtyLt: z.coerce.number().min(0).optional(),
  openingQtyEq: z.coerce.number().min(0).optional(),

  openingAmountGte: z.coerce.number().min(0).optional(),
  openingAmountLte: z.coerce.number().min(0).optional(),
  openingAmountGt: z.coerce.number().min(0).optional(),
  openingAmountLt: z.coerce.number().min(0).optional(),
  openingAmountEq: z.coerce.number().min(0).optional(),

  increaseQtyGte: z.coerce.number().min(0).optional(),
  increaseQtyLte: z.coerce.number().min(0).optional(),
  increaseQtyGt: z.coerce.number().min(0).optional(),
  increaseQtyLt: z.coerce.number().min(0).optional(),
  increaseQtyEq: z.coerce.number().min(0).optional(),

  increaseAmountGte: z.coerce.number().min(0).optional(),
  increaseAmountLte: z.coerce.number().min(0).optional(),
  increaseAmountGt: z.coerce.number().min(0).optional(),
  increaseAmountLt: z.coerce.number().min(0).optional(),
  increaseAmountEq: z.coerce.number().min(0).optional(),

  decreaseQtyGte: z.coerce.number().min(0).optional(),
  decreaseQtyLte: z.coerce.number().min(0).optional(),
  decreaseQtyGt: z.coerce.number().min(0).optional(),
  decreaseQtyLt: z.coerce.number().min(0).optional(),
  decreaseQtyEq: z.coerce.number().min(0).optional(),

  decreaseAmountGte: z.coerce.number().min(0).optional(),
  decreaseAmountLte: z.coerce.number().min(0).optional(),
  decreaseAmountGt: z.coerce.number().min(0).optional(),
  decreaseAmountLt: z.coerce.number().min(0).optional(),
  decreaseAmountEq: z.coerce.number().min(0).optional(),
});

/**
 * Query schema cho getTransactionDetails
 * Chi tiết nhập xuất của một sản phẩm
 */
export const GetTransactionDetailsQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
  productId: z.uuid().optional(),
  productVariantId: z.uuid().optional(),
  refType: z.string().optional(),
}).refine((data) => data.productId || data.productVariantId, {
  message: "productId hoặc productVariantId phải được cung cấp",
});

export type GetStockReportQueryDto = z.infer<typeof GetStockReportQuerySchema>;
export type GetTransactionDetailsQueryDto = z.infer<
  typeof GetTransactionDetailsQuerySchema
>;
