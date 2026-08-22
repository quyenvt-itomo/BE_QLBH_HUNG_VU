import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateQuotationCommissionSchema = BaseCreateSchema.extend({
  quotationId: z.uuid(),
  partnerContactId: z.uuid().nullish(),
  totalAmount: z.number().min(0),
});

export const UpdateQuotationCommissionSchema = BaseUpdateSchema.extend({
  partnerContactId: z.uuid().nullish(),
  totalAmount: z.number().min(0).optional(),
});

export const QuotationCommissionQuerySchema = BaseQuerySchema.extend({
  quotationId: z.uuid().optional(),
  partnerContactId: z.uuid().optional(),
});

export const QuotationCommissionParamsSchema = BaseParamsSchema;

export type CreateQuotationCommissionDto = z.infer<
  typeof CreateQuotationCommissionSchema
>;
export type UpdateQuotationCommissionDto = z.infer<
  typeof UpdateQuotationCommissionSchema
>;
export type QuotationCommissionQueryDto = z.infer<
  typeof QuotationCommissionQuerySchema
>;
export type QuotationCommissionParamsDto = z.infer<
  typeof QuotationCommissionParamsSchema
>;
