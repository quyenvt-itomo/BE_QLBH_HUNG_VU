import { z } from "zod";
import {
  AddressSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { Gender } from "@/shared/constants/enum";

export const CreateEmployeeSchema = BaseCreateSchema.extend({
  name: z.string().max(255),
  code: z.string().optional(),
  storeId: z.uuid(),
  positionId: z.uuid().optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  dob: DateTransform.optional(),
  gender: z.enum(Gender).optional(),
  address: AddressSchema.nullish(),
});

export const UpdateEmployeeSchema = BaseUpdateSchema.extend({
  name: z.string().max(255).optional(),
  storeId: z.uuid(),
  positionId: z.uuid().nullish(),
  phone: z.string().nullish(),
  email: z.email().nullish(),
  dob: DateTransform.nullish(),
  gender: z.enum(Gender).nullish(),
  address: AddressSchema.nullish(),
});

export const EmployeeQuerySchema = BaseQuerySchema.extend({});

export const EmployeeParamsSchema = BaseParamsSchema;

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeQueryDto = z.infer<typeof EmployeeQuerySchema>;
export type EmployeeParamsDto = z.infer<typeof EmployeeParamsSchema>;
