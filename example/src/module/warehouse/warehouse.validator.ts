import {
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseQuerySchema,
  BaseParamsSchema,
  BaseCodeSchema,
  AddressSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateWarehouseSchema = BaseCreateSchema.extend({
  code: BaseCodeSchema.optional(),
  name: z.string().trim().nonempty(),
  phone: z.string().trim().nullish(),
  address: AddressSchema.nullish(),
  managerId: z.uuid().nullish(),
});

export const UpdateWarehouseSchema = BaseUpdateSchema.extend({
  code: BaseCodeSchema.optional(),
  name: z.string().trim().nonempty().optional(),
  phone: z.string().trim().nullish(),
  address: AddressSchema.nullish(),
  managerId: z.uuid().nullish(),
});

export const WarehouseQuerySchema = BaseQuerySchema;
export const WarehouseParamsSchema = BaseParamsSchema;

export type CreateWarehouseDto = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouseDto = z.infer<typeof UpdateWarehouseSchema>;
export type WarehouseParamsDto = z.infer<typeof WarehouseParamsSchema>;
