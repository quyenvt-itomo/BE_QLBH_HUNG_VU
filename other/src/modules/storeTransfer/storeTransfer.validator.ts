import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";
import { CreateStoreTransferLineSchema } from "./storeTransferLine";

export const CreateStoreTransferSchema = BaseCreateSchema.extend({
  occurredAt: z.coerce.date(),
  code: z.string().optional(),
  fromStoreId: z.uuid(),
  toStoreId: z.uuid(),
  reason: z.string().nullish(),
  lines: z.array(CreateStoreTransferLineSchema).min(1),
}).refine((data) => data.fromStoreId !== data.toStoreId, {
  message: "toStoreId.invalid",
});

export const UpdateStoreTransferSchema = BaseUpdateSchema.extend({
  occurredAt: z.coerce.date().optional(),
  code: z.string().optional(),
  fromStoreId: z.uuid().optional(),
  toStoreId: z.uuid().optional(),
  reason: z.string().nullish(),
});

export const StoreTransferQuerySchema = BaseQuerySchema;

export const StoreTransferParamsSchema = BaseParamsSchema;

export type CreateStoreTransferDto = z.infer<typeof CreateStoreTransferSchema>;
export type UpdateStoreTransferDto = z.infer<typeof UpdateStoreTransferSchema>;
export type StoreTransferQueryDto = z.infer<typeof StoreTransferQuerySchema>;
export type StoreTransferParamsDto = z.infer<typeof StoreTransferParamsSchema>;
