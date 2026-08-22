import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

/**
 * Query schema cho getFundTransactionReport
 * Báo cáo tồn kho theo product/variant
 */
export const GetFundTransactionReportQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
});

/**
 * Query schema cho getTransactionDetails
 * Chi tiết nhập xuất của một sản phẩm
 */
export const GetTransactionDetailsQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
  fundId: z.uuid(),
});

export type GetFundTransactionReportQueryDto = z.infer<
  typeof GetFundTransactionReportQuerySchema
>;
export type GetTransactionDetailsQueryDto = z.infer<
  typeof GetTransactionDetailsQuerySchema
>;
