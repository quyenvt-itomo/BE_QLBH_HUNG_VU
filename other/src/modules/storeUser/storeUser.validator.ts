import { z } from "zod";
import {
  AddressSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
} from "@/shared/base/BaseValidator";

export const CreateStoreUserSchema = BaseCreateSchema.extend({
  userId: z.uuid(),
  roleId: z.uuid(),
});

export const UpdateStoreUserSchema = BaseUpdateSchema.extend({
  userId: z.uuid().optional(),
  roleId: z.uuid().optional(),
});

export const StoreUserQuerySchema = BaseQuerySchema;
export const StoreUserParamsSchema = BaseParamsSchema;

export type CreateStoreUserDto = z.infer<typeof CreateStoreUserSchema>;
export type UpdateStoreUserDto = z.infer<typeof UpdateStoreUserSchema>;
export type StoreUserQueryDto = z.infer<typeof StoreUserQuerySchema>;
export type StoreUserParamsDto = z.infer<typeof StoreUserParamsSchema>;
