import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateWarehouseTransferLineSchema = BaseCreateSchema.extend({
  transferId: z.uuid(),
  productId: z.uuid().nullish(),
  unitId: z.uuid().nullish(),
  conversionRateAtTime: z.number().positive().default(1),
  requestQuantity: z.number().positive(),
  sortOrder: z.number().optional(),
});

export const UpdateWarehouseTransferLineSchema = BaseUpdateSchema.extend({
  requestQuantity: z.number().positive().optional(),
  actualQuantity: z.number().min(0).optional(),
  receivedQuantity: z.number().min(0).optional(),
  sortOrder: z.number().optional(),
});

export const WarehouseTransferLineQuerySchema = BaseQuerySchema.extend({
  transferId: z.uuid().optional(),
  productId: z.uuid().optional(),
});

export const WarehouseTransferLineParamsSchema = BaseParamsSchema;

export type CreateWarehouseTransferLineDto = z.infer<
  typeof CreateWarehouseTransferLineSchema
>;
export type UpdateWarehouseTransferLineDto = z.infer<
  typeof UpdateWarehouseTransferLineSchema
>;
export type WarehouseTransferLineQueryDto = z.infer<
  typeof WarehouseTransferLineQuerySchema
>;
export type WarehouseTransferLineParamsDto = z.infer<
  typeof WarehouseTransferLineParamsSchema
>;
