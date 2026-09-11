import { z } from "zod";
import {
  BaseParamsSchema,
  BaseQuerySchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { DebtSide } from "@/shared/constants/enum";

/** Query dùng cho báo cáo tổng hợp công nợ theo đối tác. */
export const GetPartnerDebtReportQuerySchema = BaseQuerySchema.extend({
  side: z.enum(DebtSide).default(DebtSide.RECEIVABLE),
  // FE cũ dùng các nhóm invoice/payment, còn dữ liệu mới dùng enum chi tiết.
  refType: z.string().trim().optional(),
});

/** Query dùng cho sổ chi tiết công nợ của một đối tác. */
export const GetTransactionDetailsQuerySchema = BaseQuerySchema.extend({
  partnerId: z.uuid(),
  side: z.enum(DebtSide).default(DebtSide.RECEIVABLE),
  refType: z.string().trim().optional(),
});

export const DebtParamsSchema = BaseParamsSchema;
export const DebtBalanceParamsSchema = z.object({ partnerId: z.uuid() });
export const DebtBalanceQuerySchema = z.object({
  offsetAt: DateTransform.optional(),
  excludeId: z.uuid().optional(),
});

export type GetPartnerDebtReportQueryDto = z.infer<
  typeof GetPartnerDebtReportQuerySchema
>;
export type GetTransactionDetailsQueryDto = z.infer<
  typeof GetTransactionDetailsQuerySchema
>;
export type DebtBalanceQueryDto = z.infer<typeof DebtBalanceQuerySchema>;
