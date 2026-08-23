import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

export const CommissionDebtReportQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid(),
  partnerContactIds: z.array(z.uuid()).optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export const CommissionDebtDetailQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid(),
  partnerContactId: z.uuid().optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export type CommissionDebtReportQueryDto = z.infer<
  typeof CommissionDebtReportQuerySchema
>;
export type CommissionDebtDetailQueryDto = z.infer<
  typeof CommissionDebtDetailQuerySchema
>;
