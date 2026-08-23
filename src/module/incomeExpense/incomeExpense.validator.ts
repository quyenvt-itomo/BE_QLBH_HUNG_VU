import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { IncomeExpenseTypeEnum } from "@/database/models/store/IncomeExpense";

// Phân bổ thanh toán theo hóa đơn (giảm công nợ theo từng hóa đơn)
const InvoiceAllocationSchema = z.object({
  invoiceId: z.uuid(),
  amount: z.number().positive(),
  invoiceSnapshot: z.record(z.string(), z.unknown()).nullish().optional(),
});

export const CreateIncomeExpenseSchema = BaseCreateSchema.extend({
  occurredAt: DateTransform.optional(),
  type: z.enum(IncomeExpenseTypeEnum),
  fundId: z.uuid().nullish(),
  fundSnapshot: z.record(z.string(), z.unknown()).nullish(),
  staffId: z.uuid().nullish(),
  amount: z.number().min(0),
  categoryId: z.uuid().nullish(),
  categorySnapshot: z.record(z.string(), z.unknown()).nullish(),
  partnerId: z.uuid().nullish(),
  partnerSnapshot: z.record(z.string(), z.unknown()).nullish(),
  orderId: z.uuid().nullish(),
  orderSnapshot: z.record(z.string(), z.unknown()).nullish(),
  purchaseId: z.uuid().nullish(),
  purchaseSnapshot: z.record(z.string(), z.unknown()).nullish(),
  description: z.string().nullish(),
  // Đánh dấu phiếu nộp thuế VAT (type = expense) -> tăng số dư VAT
  isVatPayment: z.boolean().optional().default(false),
  // Phân bổ giảm công nợ theo từng hóa đơn
  invoiceAllocations: z.array(InvoiceAllocationSchema).default([]),
});

export const UpdateIncomeExpenseSchema = BaseUpdateSchema.extend({
  occurredAt: DateTransform.optional(),
  fundId: z.uuid().nullish(),
  staffId: z.uuid().nullish(),
  amount: z.number().min(0).optional(),
  categoryId: z.uuid().nullish(),
  partnerId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  purchaseId: z.uuid().nullish(),
  description: z.string().nullish(),
  isVatPayment: z.boolean().optional(),
  invoiceAllocations: z.array(InvoiceAllocationSchema).optional(),
});

export const IncomeExpenseQuerySchema = BaseQuerySchema.extend({
  type: z.enum(IncomeExpenseTypeEnum).optional(),
  fundId: z.uuid().optional(),
  partnerId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  purchaseId: z.uuid().optional(),
  staffId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
});

export const IncomeExpenseParamsSchema = BaseParamsSchema;

export type CreateIncomeExpenseDto = z.infer<typeof CreateIncomeExpenseSchema>;
export type UpdateIncomeExpenseDto = z.infer<typeof UpdateIncomeExpenseSchema>;
export type IncomeExpenseQueryDto = z.infer<typeof IncomeExpenseQuerySchema>;
export type IncomeExpenseParamsDto = z.infer<typeof IncomeExpenseParamsSchema>;
