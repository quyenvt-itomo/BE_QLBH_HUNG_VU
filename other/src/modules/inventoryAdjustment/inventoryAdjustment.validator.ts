import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { CreateInventoryAdjustmentLineSchema } from "./inventoryAdjustmentLine";

export const CreateInventoryAdjustmentSchema = BaseCreateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform,
  storeId: z.uuid(),
  reason: z.string().optional(),
  adjustedById: z.string(),
  isInitialAdjustment: z.boolean().optional(),
  lines: z.array(CreateInventoryAdjustmentLineSchema).min(1),
});

export const UpdateInventoryAdjustmentSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  occurredAt: DateTransform.optional(),
  storeId: z.uuid(),
  adjustedById: z.uuid().optional(),
  reason: z.string().nullish(),
  isInitialAdjustment: z.boolean().optional(),
});

export const InventoryAdjustmentQuerySchema = BaseQuerySchema.extend({
  totalAdjustmentQtyGte: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyLte: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyGt: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyLt: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyEq: z.coerce.number().min(0).optional(),

  totalAdjustmentValueGte: z.coerce.number().min(0).optional(),
  totalAdjustmentValueLte: z.coerce.number().min(0).optional(),
  totalAdjustmentValueGt: z.coerce.number().min(0).optional(),
  totalAdjustmentValueLt: z.coerce.number().min(0).optional(),
  totalAdjustmentValueEq: z.coerce.number().min(0).optional(),
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
