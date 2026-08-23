import { z } from "zod";
import { BaseQuerySchema, DateTransform } from "@/shared/base/BaseValidator";
import { PartnerDebtSideEnum } from "@/database/models/company/DebtTransaction";
import { InvoiceType } from "@/database/models/company/Invoice";

export const PartnerDebtReportQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid(),
  side: z.enum(PartnerDebtSideEnum).optional(),
  partnerIds: z.array(z.uuid()).optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

export const PartnerDebtDetailQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid(),
  partnerId: z.uuid().optional(),
  side: z.enum(PartnerDebtSideEnum).optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
});

/**
 * Nợ hiện tại theo hóa đơn: BẮT BUỘC truyền invoiceType (input | output).
 * Không lọc theo thời gian — luôn tính tới hiện tại dựa trên:
 *   invoiceDate + status (!= PAID) + totalRemainingAmount.
 * Mỗi đối tác:
 *   totalDebt = totalNotDue + totalOverdue
 *             = under30Days + under60Days + under90Days + over90Days
 */
export const PartnerDebtListQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid(),
  invoiceType: z.enum(InvoiceType),
  keyword: z.string().optional(),
  partnerIds: z.array(z.uuid()).optional(),
  sortBy: z
    .enum([
      "totalDebt",
      "totalNotDue",
      "totalOverdue",
      "under30Days",
      "under60Days",
      "under90Days",
      "over90Days",
      "name",
      "code",
    ])
    .default("totalDebt"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
});

/**
 * Chi tiết nợ theo hóa đơn của 1 đối tác (invoiceType + partnerId):
 * danh sách các hóa đơn còn nợ kèm allocations + đối trừ + điều chỉnh.
 */
export const PartnerDebtInvoiceListQuerySchema = BaseQuerySchema.extend({
  storeId: z.uuid(),
  invoiceType: z.enum(InvoiceType),
  partnerId: z.uuid(),
});

export type PartnerDebtReportQueryDto = z.infer<
  typeof PartnerDebtReportQuerySchema
>;
export type PartnerDebtDetailQueryDto = z.infer<
  typeof PartnerDebtDetailQuerySchema
>;
export type PartnerDebtListQueryDto = z.infer<
  typeof PartnerDebtListQuerySchema
>;
export type PartnerDebtInvoiceListQueryDto = z.infer<
  typeof PartnerDebtInvoiceListQuerySchema
>;
