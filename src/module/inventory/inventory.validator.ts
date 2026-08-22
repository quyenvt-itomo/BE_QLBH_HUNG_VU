import { z } from "zod";
import {
  BaseNumberQuerySchema,
  BaseQuerySchema,
  DateTransform,
  zArrayable,
} from "@/shared/base/BaseValidator";
import { InventoryTransactionRefType } from "@/database/models/company/InventoryTransaction";
import { ProductType } from "@/database/models/company/Product";

/**
 * Query schema cho getStockReport
 * Báo cáo tồn kho theo product/variant
 */
export const GetStockReportQuerySchema = BaseQuerySchema.extend({
  // Override để make required
  types: z.array(z.enum(ProductType)).optional(),

  startAt: DateTransform,
  endAt: DateTransform,
  productCategoryIds: z.array(z.uuid()).optional(),
  warehouseIds: z.array(z.uuid()).optional(),

  closingQuantityGte: BaseNumberQuerySchema,
  closingQuantityLte: BaseNumberQuerySchema,
  closingQuantityGt: BaseNumberQuerySchema,
  closingQuantityLt: BaseNumberQuerySchema,
  closingQuantityEq: BaseNumberQuerySchema,

  closingAmountGte: BaseNumberQuerySchema,
  closingAmountLte: BaseNumberQuerySchema,
  closingAmountGt: BaseNumberQuerySchema,
  closingAmountLt: BaseNumberQuerySchema,
  closingAmountEq: BaseNumberQuerySchema,

  openingQuantityGte: BaseNumberQuerySchema,
  openingQuantityLte: BaseNumberQuerySchema,
  openingQuantityGt: BaseNumberQuerySchema,
  openingQuantityLt: BaseNumberQuerySchema,
  openingQuantityEq: BaseNumberQuerySchema,

  openingAmountGte: BaseNumberQuerySchema,
  openingAmountLte: BaseNumberQuerySchema,
  openingAmountGt: BaseNumberQuerySchema,
  openingAmountLt: BaseNumberQuerySchema,
  openingAmountEq: BaseNumberQuerySchema,

  inQuantityGte: BaseNumberQuerySchema,
  inQuantityLte: BaseNumberQuerySchema,
  inQuantityGt: BaseNumberQuerySchema,
  inQuantityLt: BaseNumberQuerySchema,
  inQuantityEq: BaseNumberQuerySchema,

  inAmountGte: BaseNumberQuerySchema,
  inAmountLte: BaseNumberQuerySchema,
  inAmountGt: BaseNumberQuerySchema,
  inAmountLt: BaseNumberQuerySchema,
  inAmountEq: BaseNumberQuerySchema,

  outQuantityGte: BaseNumberQuerySchema,
  outQuantityLte: BaseNumberQuerySchema,
  outQuantityGt: BaseNumberQuerySchema,
  outQuantityLt: BaseNumberQuerySchema,
  outQuantityEq: BaseNumberQuerySchema,

  outAmountGte: BaseNumberQuerySchema,
  outAmountLte: BaseNumberQuerySchema,
  outAmountGt: BaseNumberQuerySchema,
  outAmountLt: BaseNumberQuerySchema,
  outAmountEq: BaseNumberQuerySchema,
});

/**
 * Query schema cho getTransactionDetails
 * Chi tiết nhập xuất của một sản phẩm
 */
export const GetTransactionDetailsQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
  productId: z.uuid(),
  refType: z.enum(InventoryTransactionRefType).optional(),
  page: BaseNumberQuerySchema,
  size: BaseNumberQuerySchema,
});

export type GetStockReportQueryDto = z.infer<typeof GetStockReportQuerySchema>;
export type GetTransactionDetailsQueryDto = z.infer<
  typeof GetTransactionDetailsQuerySchema
>;
