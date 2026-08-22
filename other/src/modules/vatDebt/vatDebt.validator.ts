import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

/**
 * Query schema cho getVatDebtReport
 * Báo cáo tồn kho theo product/variant
 */
export const GetVatDebtReportQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
});

/**
 * Query schema cho getTransactionDetails
 * Chi tiết nhập xuất của một sản phẩm
 */
export const GetVatDebtQuerySchema = BaseQuerySchema.extend({
  offsetAt: DateTransform.optional(),
});

export type GetVatDebtReportQueryDto = z.infer<
  typeof GetVatDebtReportQuerySchema
>;
export type GetVatDebtQueryDto = z.infer<typeof GetVatDebtQuerySchema>;
