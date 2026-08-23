import { z } from "zod";
import {
  AddressSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
} from "@/shared/base/BaseValidator";

export const CreateStoreSchema = BaseCreateSchema.extend({
  name: z.string().max(255),
  code: z.string().optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  taxCode: z.string().optional(),
  address: AddressSchema.nullish(),
});

export const UpdateStoreSchema = BaseUpdateSchema.extend({
  name: z.string().max(255).optional(),
  code: z.string().optional(),
  phone: z.string().nullish(),
  email: z.email().nullish(),
  taxCode: z.string().nullish(),
  address: AddressSchema.nullish(),
  isActive: z.boolean().optional(),
});

export const StoreQuerySchema = BaseQuerySchema;
export const StoreParamsSchema = BaseParamsSchema;

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>;
export type StoreQueryDto = z.infer<typeof StoreQuerySchema>;
export type StoreParamsDto = z.infer<typeof StoreParamsSchema>;
