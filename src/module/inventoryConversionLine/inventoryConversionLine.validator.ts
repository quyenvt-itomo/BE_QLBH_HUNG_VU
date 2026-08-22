import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { ApproveStatus } from "@/shared/constants/enum";

export const CreateInventoryConversionLineSchema = BaseCreateSchema.extend({
  inventoryConversionId: z.string().uuid(),
  fromProductId: z.string().uuid().nullish(),
  toProductId: z.string().uuid().nullish(),
  quantity: z.number().positive().nullish(),
});

export const UpdateInventoryConversionLineSchema = BaseUpdateSchema.extend({
  fromProductId: z.string().uuid().nullish(),
  toProductId: z.string().uuid().nullish(),
  quantity: z.number().positive().optional(),
});

export const RejectInventoryConversionLineSchema = z.object({
  rejectReason: z.string().min(1),
});

export const InventoryConversionLineQuerySchema = BaseQuerySchema.extend({
  inventoryConversionId: z.string().uuid().optional(),
  fromProductId: z.string().uuid().optional(),
  toProductId: z.string().uuid().optional(),
  approveStatus: z
    .enum([
      ApproveStatus.PENDING,
      ApproveStatus.APPROVED,
      ApproveStatus.REJECTED,
    ])
    .optional(),
});

export const InventoryConversionLineParamsSchema = BaseParamsSchema;

export type CreateInventoryConversionLineDto = z.infer<
  typeof CreateInventoryConversionLineSchema
>;
export type UpdateInventoryConversionLineDto = z.infer<
  typeof UpdateInventoryConversionLineSchema
>;
export type RejectInventoryConversionLineDto = z.infer<
  typeof RejectInventoryConversionLineSchema
>;
export type InventoryConversionLineQueryDto = z.infer<
  typeof InventoryConversionLineQuerySchema
>;
export type InventoryConversionLineParamsDto = z.infer<
  typeof InventoryConversionLineParamsSchema
>;
