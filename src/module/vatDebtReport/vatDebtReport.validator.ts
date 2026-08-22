import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";

export const VatDebtReportQuerySchema = BaseQuerySchema.extend({
  companyId: z.uuid(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export const VatDebtDetailQuerySchema = BaseQuerySchema.extend({
  companyId: z.uuid(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export type VatDebtReportQueryDto = z.infer<typeof VatDebtReportQuerySchema>;
export type VatDebtDetailQueryDto = z.infer<typeof VatDebtDetailQuerySchema>;
