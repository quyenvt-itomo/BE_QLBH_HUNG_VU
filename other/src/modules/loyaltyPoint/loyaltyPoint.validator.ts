import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";
import { LoyaltyPointTransactionType } from "@/shared/constants/enum";

/**
 * Query schema cho getPartnerPointsReport
 * Báo cáo tích điểm theo partner
 */
export const GetPartnerPointsReportQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
  partnerIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
});

/**
 * Query schema cho getTransactionDetails
 * Chi tiết giao dịch tích điểm của một partner
 */
export const GetTransactionDetailsQuerySchema = BaseQuerySchema.extend({
  startAt: DateTransform,
  endAt: DateTransform,
  partnerId: z.uuid(),
  type: z.enum(LoyaltyPointTransactionType).optional(),
});

export type GetPartnerPointsReportQueryDto = z.infer<
  typeof GetPartnerPointsReportQuerySchema
>;
export type GetTransactionDetailsQueryDto = z.infer<
  typeof GetTransactionDetailsQuerySchema
>;

/**
 * Schema cho recalculateFromDate
 * Tính lại loyalty points và revenue từ một ngày
 */
export const RecalculateFromDateSchema = z.object({
  fromDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  partnerIds: z.array(z.uuid()).optional(),
});

export type RecalculateFromDateDto = z.infer<typeof RecalculateFromDateSchema>;
