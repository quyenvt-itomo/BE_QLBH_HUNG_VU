import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreatePurchaseQuotationLineSchema = BaseCreateSchema.extend({
  purchaseQuotationId: z.uuid(),
  purchaseRequisitionId: z.uuid().nullish(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
});

export const UpdatePurchaseQuotationLineSchema = BaseUpdateSchema.extend({
  purchaseQuotationId: z.uuid().optional(),
  purchaseRequisitionId: z.uuid().nullish(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
});

export const PurchaseQuotationLineQuerySchema = BaseQuerySchema.extend({
  purchaseQuotationId: z.uuid().optional(),
  productId: z.uuid().optional(),
});

export const PurchaseQuotationLineParamsSchema = BaseParamsSchema;

export type CreatePurchaseQuotationLineDto = z.infer<
  typeof CreatePurchaseQuotationLineSchema
>;
export type UpdatePurchaseQuotationLineDto = z.infer<
  typeof UpdatePurchaseQuotationLineSchema
>;
export type PurchaseQuotationLineQueryDto = z.infer<
  typeof PurchaseQuotationLineQuerySchema
>;
export type PurchaseQuotationLineParamsDto = z.infer<
  typeof PurchaseQuotationLineParamsSchema
>;
