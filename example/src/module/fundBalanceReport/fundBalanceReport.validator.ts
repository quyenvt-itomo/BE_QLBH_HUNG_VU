import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

export const FundBalanceReportQuerySchema = BaseQuerySchema.extend({
  companyId: z.uuid(),
  fundIds: z.array(z.uuid()).optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export const FundBalanceDetailQuerySchema = BaseQuerySchema.extend({
  companyId: z.uuid(),
  fundId: z.uuid().optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export type FundBalanceReportQueryDto = z.infer<
  typeof FundBalanceReportQuerySchema
>;
export type FundBalanceDetailQueryDto = z.infer<
  typeof FundBalanceDetailQuerySchema
>;
