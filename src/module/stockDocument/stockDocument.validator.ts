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
  StockDocumentType,
  StockDocumentStatus,
} from "@/database/models/company/StockDocument";

export const StockDocumentLineSchema = BaseLineSchema.extend({
  purchaseLineId: z.uuid().nullish(),
  orderLineId: z.uuid().nullish(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  conversionRateAtTime: z.number().positive().default(1),
  requestQuantity: z.number().positive().nullish(),
  stockQuantity: z.number().min(0).nullish(),
  additionalQuantity: z.number().min(0).nullish(),
  billingQuantity: z.number().min(0).nullish(),
  varianceQuantity: z.number().nullish(),
  varianceAmount: z.number().nullish(),
  costPriceAtTime: z.number().nullish(),
  costAmount: z.number().nullish(),
});

export const CreateStockDocumentSchema = BaseCreateSchema.extend({
  effectiveDate: DateTransform.nullish(),
  type: z.enum(StockDocumentType),

  orderId: z.uuid().nullish(),
  purchaseId: z.uuid().nullish(),
  productionId: z.uuid().nullish(),

  partnerId: z.uuid().nullish(),
  shippingPlanId: z.uuid().nullish(),
  warehouseId: z.uuid().nullish(),

  representative: z.record(z.string(), z.unknown()).nullish(),
  vehicleType: z.string().max(255).nullish(),
  vehiclePlate: z.string().max(255).nullish(),

  sequenceNumber: z.number().int().positive().default(1),
  lines: z.array(StockDocumentLineSchema).default([]),
});

export const UpdateStockDocumentSchema = BaseUpdateSchema.extend({
  effectiveDate: DateTransform.nullish(),
  actualImportDate: DateTransform.nullish(),
  actualExportDate: DateTransform.nullish(),

  representative: z.record(z.string(), z.unknown()).nullish(),
  vehicleType: z.string().max(255).nullish(),
  vehiclePlate: z.string().max(255).nullish(),

  lines: z.array(StockDocumentLineSchema).optional(),
});

export const ConfirmImportSchema = z.object({
  actualImportDate: DateTransform.nullish(),
  lines: z.array(
    z.object({
      id: z.uuid(),
      stockQuantity: z.number().min(0),
    }),
  ),
});
export const ConfirmExportSchema = z.object({
  actualExportDate: DateTransform.nullish(),
  lines: z.array(
    z.object({
      id: z.uuid(),
      stockQuantity: z.number().min(0),
      additionalQuantity: z.number().min(0).optional(),
    }),
  ),
});
export const ConfirmBillingSchema = z.object({
  lines: z.array(
    z.object({
      id: z.uuid(),
      billingQuantity: z.number().min(0),
    }),
  ),
});

export const StockDocumentQuerySchema = BaseQuerySchema.extend({
  type: z.enum(StockDocumentType).optional(),
  status: z.enum(StockDocumentStatus).optional(),
  warehouseId: z.uuid().optional(),
  partnerId: z.uuid().optional(),
  purchaseId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  productionId: z.uuid().optional(),
});

export const StockDocumentParamsSchema = BaseParamsSchema;

export type CreateStockDocumentDto = z.infer<typeof CreateStockDocumentSchema>;
export type UpdateStockDocumentDto = z.infer<typeof UpdateStockDocumentSchema>;
export type ConfirmImportDto = z.infer<typeof ConfirmImportSchema>;
export type ConfirmExportDto = z.infer<typeof ConfirmExportSchema>;
export type ConfirmBillingDto = z.infer<typeof ConfirmBillingSchema>;
export type StockDocumentQueryDto = z.infer<typeof StockDocumentQuerySchema>;
export type StockDocumentParamsDto = z.infer<typeof StockDocumentParamsSchema>;
