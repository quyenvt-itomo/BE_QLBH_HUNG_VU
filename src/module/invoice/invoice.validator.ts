import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  BaseLineSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import {
  InvoiceType,
  InvoiceSourceType,
} from "@/database/models/company/Invoice";

export const InvoiceLineSchema = BaseLineSchema.extend({
  sourceLineId: z.uuid().nullish(),
  productId: z.uuid().nullish(),
  productName: z.string().nullish(),
  productCode: z.string().nullish(),
  unit: z.string().nullish(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const CreateInvoiceSchema = BaseCreateSchema.extend({
  invoiceDate: DateTransform,
  invoiceNumber: z.string().max(20),
  referenceNumber: z.string().max(50).nullish(),
  referenceDate: DateTransform.nullish(),
  type: z.enum(InvoiceType),
  sourceType: z.enum(InvoiceSourceType),
  partnerId: z.uuid().nullish(),
  orderId: z.uuid().nullish(),
  purchaseId: z.uuid().nullish(),
  stockDocumentId: z.uuid().nullish(),
  shippingPlanId: z.uuid().nullish(),
  lines: z.array(InvoiceLineSchema).default([]),
});

export const UpdateInvoiceSchema = BaseUpdateSchema.extend({
  invoiceDate: DateTransform.optional(),
  invoiceNumber: z.string().max(20).optional(),
  referenceNumber: z.string().max(50).nullish(),
  referenceDate: DateTransform.nullish(),
  subTotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  lines: z.array(InvoiceLineSchema).optional(),
});

export const InvoiceQuerySchema = BaseQuerySchema.extend({
  type: z.enum(InvoiceType).optional(),
  sourceType: z.enum(InvoiceSourceType).optional(),
  partnerId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  purchaseId: z.uuid().optional(),
  stockDocumentId: z.uuid().optional(),
  shippingPlanId: z.uuid().optional(),
});

export const InvoiceParamsSchema = BaseParamsSchema;

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceQueryDto = z.infer<typeof InvoiceQuerySchema>;
export type InvoiceParamsDto = z.infer<typeof InvoiceParamsSchema>;
