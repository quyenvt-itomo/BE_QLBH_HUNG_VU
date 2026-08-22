import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateInventoryAdjustmentLineSchema = BaseCreateSchema.extend({
  productVariantId: z.uuid(),
  expectedQty: z.number().min(0),
});

export const UpdateInventoryAdjustmentLineSchema = BaseUpdateSchema.extend({
  expectedQty: z.number().min(0).optional(),
  sortOrder: z.number().optional(),
});

export const InventoryAdjustmentLineQuerySchema = BaseQuerySchema;

export const InventoryAdjustmentLineCreateParamsSchema = z.object({
  adjustmentId: z.uuid(),
});

export const InventoryAdjustmentLineParamsSchema = BaseParamsSchema.extend({
  adjustmentId: z.uuid(),
});

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
export type InventoryAdjustmentLineCreateParamsDto = z.infer<
  typeof InventoryAdjustmentLineCreateParamsSchema
>;
