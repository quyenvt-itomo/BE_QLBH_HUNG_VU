import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
  zBooleanLike,
  BaseLineSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { TransactionType } from "@/shared/constants/enum";

export const AdjustmentLineSchema = BaseLineSchema.extend({
  productId: z.uuid(),
  expectedQuantity: z.number().min(0),
  countedQuantity: z.number().min(0),
  deltaQuantity: z.number(),
  type: z.enum(TransactionType),
  costPriceAtTime: z.number().min(0),
  adjustmentValue: z.number(),
});

export const CreateInventoryAdjustmentSchema = BaseCreateSchema.extend({
  warehouseId: z.uuid(),
  occurredAt: DateTransform.optional(),
  reason: z.string().nullish(),
  totalAdjustmentQuantity: z.number().default(0),
  totalAdjustmentValue: z.number().default(0),
  isInitial: z.boolean().default(false),
  lines: z.array(AdjustmentLineSchema).default([]),
});

export const UpdateInventoryAdjustmentSchema = BaseUpdateSchema.extend({
  occurredAt: DateTransform.optional(),
  reason: z.string().nullish(),
  totalAdjustmentQuantity: z.number().optional(),
  totalAdjustmentValue: z.number().optional(),
  lines: z.array(AdjustmentLineSchema).optional(),
});

export const InventoryAdjustmentQuerySchema = BaseQuerySchema.extend({
  warehouseId: z.uuid().optional(),
  isInitial: zBooleanLike().optional(),
});

export const InventoryAdjustmentParamsSchema = BaseParamsSchema;

export type CreateInventoryAdjustmentDto = z.infer<
  typeof CreateInventoryAdjustmentSchema
>;
export type UpdateInventoryAdjustmentDto = z.infer<
  typeof UpdateInventoryAdjustmentSchema
>;
export type InventoryAdjustmentQueryDto = z.infer<
  typeof InventoryAdjustmentQuerySchema
>;
export type InventoryAdjustmentParamsDto = z.infer<
  typeof InventoryAdjustmentParamsSchema
>;
