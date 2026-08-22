import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateQuotationRequestLineSchema = BaseCreateSchema.extend({
  quotationRequestId: z.uuid(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive(),
});

export const UpdateQuotationRequestLineSchema = BaseUpdateSchema.extend({
  quotationRequestId: z.uuid().optional(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  quantity: z.number().positive().optional(),
});

export const QuotationRequestLineQuerySchema = BaseQuerySchema.extend({
  quotationRequestId: z.uuid().optional(),
  productId: z.uuid().optional(),
});

export const QuotationRequestLineParamsSchema = BaseParamsSchema;

export type CreateQuotationRequestLineDto = z.infer<
  typeof CreateQuotationRequestLineSchema
>;
export type UpdateQuotationRequestLineDto = z.infer<
  typeof UpdateQuotationRequestLineSchema
>;
export type QuotationRequestLineQueryDto = z.infer<
  typeof QuotationRequestLineQuerySchema
>;
export type QuotationRequestLineParamsDto = z.infer<
  typeof QuotationRequestLineParamsSchema
>;
