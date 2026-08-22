import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateStockDocumentLineSchema = BaseCreateSchema.extend({
  stockDocumentId: z.uuid(),
  purchaseLineId: z.uuid().nullish(),
  orderLineId: z.uuid().nullish(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  conversionRateAtTime: z.number().positive().default(1),
  requestQuantity: z.number().nullish(),
  stockQuantity: z.number().nullish(),
  additionalQuantity: z.number().nullish(),
  billingQuantity: z.number().nullish(),
});

export const UpdateStockDocumentLineSchema = BaseUpdateSchema.extend({
  stockDocumentId: z.uuid().optional(),
  purchaseLineId: z.uuid().nullish(),
  orderLineId: z.uuid().nullish(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  conversionRateAtTime: z.number().positive().optional(),
  requestQuantity: z.number().nullish(),
  stockQuantity: z.number().nullish(),
  additionalQuantity: z.number().nullish(),
  billingQuantity: z.number().nullish(),
});

export const StockDocumentLineQuerySchema = BaseQuerySchema.extend({
  stockDocumentId: z.uuid().optional(),
  productId: z.uuid().optional(),
});

export const StockDocumentLineParamsSchema = BaseParamsSchema;

export type CreateStockDocumentLineDto = z.infer<
  typeof CreateStockDocumentLineSchema
>;
export type UpdateStockDocumentLineDto = z.infer<
  typeof UpdateStockDocumentLineSchema
>;
export type StockDocumentLineQueryDto = z.infer<
  typeof StockDocumentLineQuerySchema
>;
export type StockDocumentLineParamsDto = z.infer<
  typeof StockDocumentLineParamsSchema
>;
