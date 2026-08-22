import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateInventoryConversionSchema = BaseCreateSchema.extend({
  code: z.string(),
  timeAt: DateTransform.optional(),
  staffId: z.string().uuid().nullish(),
  reason: z.string().nullish(),
});

export const UpdateInventoryConversionSchema = BaseUpdateSchema.extend({
  code: z.string().optional(),
  timeAt: DateTransform.optional(),
  staffId: z.string().uuid().nullish(),
  reason: z.string().nullish(),
});

export const InventoryConversionQuerySchema = BaseQuerySchema.extend({
  staffId: z.string().uuid().optional(),
});

export const InventoryConversionParamsSchema = BaseParamsSchema;

export type CreateInventoryConversionDto = z.infer<
  typeof CreateInventoryConversionSchema
>;
export type UpdateInventoryConversionDto = z.infer<
  typeof UpdateInventoryConversionSchema
>;
export type InventoryConversionQueryDto = z.infer<
  typeof InventoryConversionQuerySchema
>;
export type InventoryConversionParamsDto = z.infer<
  typeof InventoryConversionParamsSchema
>;
