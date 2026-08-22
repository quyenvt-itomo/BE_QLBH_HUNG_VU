import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateStoreTransferLineSchema = BaseCreateSchema.extend({
  productVariantId: z.uuid(),
  quantity: z.number().min(0),
});

export const UpdateStoreTransferLineSchema = BaseUpdateSchema.extend({
  quantity: z.number().min(0).optional(),
  unitId: z.uuid().optional(),
});

export const StoreTransferLineQuerySchema = BaseQuerySchema;

export const StoreTransferLineCreateParamsSchema = z.object({
  transferId: z.uuid(),
});

export const StoreTransferLineParamsSchema = BaseParamsSchema.extend({
  transferId: z.uuid(),
});

export type CreateStoreTransferLineDto = z.infer<
  typeof CreateStoreTransferLineSchema
>;
export type UpdateStoreTransferLineDto = z.infer<
  typeof UpdateStoreTransferLineSchema
>;
export type StoreTransferLineQueryDto = z.infer<
  typeof StoreTransferLineQuerySchema
>;
export type StoreTransferLineParamsDto = z.infer<
  typeof StoreTransferLineParamsSchema
>;
export type StoreTransferLineCreateParamsDto = z.infer<
  typeof StoreTransferLineCreateParamsSchema
>;
