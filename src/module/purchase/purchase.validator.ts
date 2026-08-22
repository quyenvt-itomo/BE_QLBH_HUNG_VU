import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  zBooleanLike,
  BaseLineSchema,
  AdditionalInfoSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ApproveStatus, DiscountTypeEnum } from "@/shared/constants/enum";
import { PaymentMethod } from "@/database/models/company/Purchase";

export const PurchaseLineSchema = BaseLineSchema.extend({
  productId: z.uuid(),
  unitId: z.uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  subTotal: z.number().min(0),
  taxAmount: z.number().min(0),
  grossAmount: z.number().min(0),
  commissionRate: z.number().min(0).max(100).default(0),
  commissionAmount: z.number().min(0).default(0),
});

export const CreatePurchaseSchema = BaseCreateSchema.extend({
  orderedAt: DateTransform.optional(),
  supplierId: z.uuid().nullish(),
  sellerId: z.uuid().nullish(),
  staffId: z.uuid().nullish(),
  paymentMethod: z.enum(PaymentMethod).nullish(),
  toleranceRate: z.number().min(0).max(100).optional(),
  discountType: z.enum(DiscountTypeEnum).default(DiscountTypeEnum.AMOUNT),
  discountValue: z.number().min(0).default(0),
  taxType: z.enum(DiscountTypeEnum).default(DiscountTypeEnum.PERCENT),
  taxValue: z.number().min(0).default(0),
  additionalInfo: z.array(AdditionalInfoSchema).optional().default([]),
  lines: z.array(PurchaseLineSchema).default([]),
});

export const UpdatePurchaseSchema = BaseUpdateSchema.extend({
  orderedAt: DateTransform.optional(),
  supplierId: z.uuid().nullish(),
  sellerId: z.uuid().nullish(),
  staffId: z.uuid().nullish(),
  paymentMethod: z.enum(PaymentMethod).nullish(),
  toleranceRate: z.number().min(0).max(100).optional(),
  discountType: z.enum(DiscountTypeEnum).optional(),
  discountValue: z.number().min(0).optional(),
  taxType: z.enum(DiscountTypeEnum).optional(),
  taxValue: z.number().min(0).optional(),
  additionalInfo: z.array(AdditionalInfoSchema).optional(),
  lines: z.array(PurchaseLineSchema).optional(),
});

export const PurchaseQuerySchema = BaseQuerySchema.extend({
  approveStatus: z.enum(ApproveStatus).optional(),
  supplierId: z.uuid().optional(),
  staffId: z.uuid().optional(),
  isCompleted: zBooleanLike(),
});

export const PurchaseParamsSchema = BaseParamsSchema;

export const ApproveRejectSchema = z.object({
  rejectReason: z.string().trim().optional(),
});

export type CreatePurchaseDto = z.infer<typeof CreatePurchaseSchema>;
export type UpdatePurchaseDto = z.infer<typeof UpdatePurchaseSchema>;
export type PurchaseQueryDto = z.infer<typeof PurchaseQuerySchema>;
export type PurchaseParamsDto = z.infer<typeof PurchaseParamsSchema>;
export type ApproveRejectDto = z.infer<typeof ApproveRejectSchema>;
