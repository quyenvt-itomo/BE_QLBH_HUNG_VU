import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";
import { PartnerDebtSideEnum } from "@/shared/constants/enum";

/**
 * Query schema cho getPartnerDebtReport
 * Báo cáo tồn kho theo product/variant
 */
export const GetPartnerDebtReportQuerySchema = BaseQuerySchema.extend({
  side: z.enum(PartnerDebtSideEnum),
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
  side: z.enum(PartnerDebtSideEnum),
  partnerId: z.uuid(),
});

export type GetPartnerDebtReportQueryDto = z.infer<
  typeof GetPartnerDebtReportQuerySchema
>;
export type GetTransactionDetailsQueryDto = z.infer<
  typeof GetTransactionDetailsQuerySchema
>;
