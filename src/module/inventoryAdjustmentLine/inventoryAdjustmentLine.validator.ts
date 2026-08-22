import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateInventoryAdjustmentLineSchema = BaseCreateSchema.extend({
  adjustmentId: z.string().uuid(),
  productId: z.string().uuid(),
  expectedQuantity: z.number().min(0),
  countedQuantity: z.number().min(0).default(0),
  sortOrder: z.number().optional(),
});

export const UpdateInventoryAdjustmentLineSchema = BaseUpdateSchema.extend({
  expectedQuantity: z.number().min(0).optional(),
  countedQuantity: z.number().min(0).optional(),
  sortOrder: z.number().optional(),
});

export const InventoryAdjustmentLineQuerySchema = BaseQuerySchema.extend({
  adjustmentId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});

export const InventoryAdjustmentLineParamsSchema = BaseParamsSchema;

export type CreateInventoryAdjustmentLineDto = z.infer<
  typeof CreateInventoryAdjustmentLineSchema
>;
export type UpdateInventoryAdjustmentLineDto = z.infer<
  typeof UpdateInventoryAdjustmentLineSchema
>;
export type InventoryAdjustmentLineQueryDto = z.infer<
  typeof InventoryAdjustmentLineQuerySchema
>;
export type InventoryAdjustmentLineParamsDto = z.infer<
  typeof InventoryAdjustmentLineParamsSchema
>;
