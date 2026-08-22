import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { SaleLineTypeEnum } from "@/shared/constants/enum";

export const CreateQuotationLineSchema = BaseCreateSchema.extend({
  quotationId: z.uuid(),
  type: z.enum(SaleLineTypeEnum),
  productId: z.uuid().nullish(),
  serviceId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  rawQuantity: z.number().positive(),
  rawUnitPrice: z.number().min(0),
  rawMaterialQuantity: z.number().min(0).optional().default(0),
  rawMaterialUnitPrice: z.number().min(0).optional().default(0),
  rawAdditionalCost: z.number().min(0).optional().default(0),
  materialId: z.uuid().nullish(),
});

export const UpdateQuotationLineSchema = BaseUpdateSchema.extend({
  type: z.enum(SaleLineTypeEnum).optional(),
  productId: z.uuid().nullish(),
  serviceId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  rawQuantity: z.number().positive().optional(),
  rawUnitPrice: z.number().min(0).optional(),
  rawMaterialQuantity: z.number().min(0).optional(),
  rawMaterialUnitPrice: z.number().min(0).optional(),
  rawAdditionalCost: z.number().min(0).optional(),
  materialId: z.uuid().nullish(),
});

export const QuotationLineQuerySchema = BaseQuerySchema.extend({
  quotationId: z.uuid().optional(),
  type: z.enum(SaleLineTypeEnum).optional(),
  productId: z.uuid().optional(),
});

export const QuotationLineParamsSchema = BaseParamsSchema;

export type CreateQuotationLineDto = z.infer<typeof CreateQuotationLineSchema>;
export type UpdateQuotationLineDto = z.infer<typeof UpdateQuotationLineSchema>;
export type QuotationLineQueryDto = z.infer<typeof QuotationLineQuerySchema>;
export type QuotationLineParamsDto = z.infer<typeof QuotationLineParamsSchema>;
