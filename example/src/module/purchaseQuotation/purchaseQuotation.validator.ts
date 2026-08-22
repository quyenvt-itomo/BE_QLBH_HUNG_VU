import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  BaseLineSchema,
  BasePublicParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ApproveStatus } from "@/shared/constants/enum";

export const PurchaseQuotationLineSchema = BaseLineSchema.extend({
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const CreatePurchaseQuotationSchema = BaseCreateSchema.extend({
  companyId: z.uuid(),
  timeAt: DateTransform.optional(),
  staffId: z.uuid().nullish(),
  supplierId: z.uuid().nullish(),
  supplierSnapshot: z.record(z.string(), z.unknown()).nullish(),
  quoterId: z.uuid().nullish(),
  quoterSnapshot: z.record(z.string(), z.unknown()).nullish(),
  referralCodeId: z.uuid().nullish(),
  lines: z.array(PurchaseQuotationLineSchema).default([]),
});

export const PurchaseQuotationQuerySchema = BaseQuerySchema.extend({
  approveStatus: z
    .enum([
      ApproveStatus.PENDING,
      ApproveStatus.APPROVED,
      ApproveStatus.REJECTED,
    ])
    .optional(),
  supplierId: z.uuid().optional(),
  staffId: z.uuid().optional(),
});

export const PurchaseQuotationParamsSchema = BaseParamsSchema;
export const PurchaseQuotationPublicParamsSchema = BasePublicParamsSchema;

export const ApproveRejectSchema = z.object({
  rejectReason: z.string().trim().optional(),
  submitInfo: z.boolean().optional(),
});

export type CreatePurchaseQuotationDto = z.infer<
  typeof CreatePurchaseQuotationSchema
>;

export type PurchaseQuotationQueryDto = z.infer<
  typeof PurchaseQuotationQuerySchema
>;
export type PurchaseQuotationParamsDto = z.infer<
  typeof PurchaseQuotationParamsSchema
>;
export type ApproveRejectDto = z.infer<typeof ApproveRejectSchema>;
export type PurchaseQuotationPublicParamsDto = z.infer<
  typeof PurchaseQuotationPublicParamsSchema
>;
