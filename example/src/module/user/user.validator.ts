import { z } from "zod";
import {
  BaseQuerySchema,
  BaseParamsSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
  BaseCodeSchema,
} from "@/shared/base/BaseValidator";

export const CompanyUserItemSchema = z.object({
  id: z.uuid().optional(),
  companyId: z.uuid(),
  roleId: z.uuid().nullish(),
  employeeId: z.uuid().nullish(),
});

export const CreateUserSchema = BaseCreateSchema.extend({
  code: BaseCodeSchema.optional(),
  name: z.string().trim().max(255),
  username: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(255).nullish(),
  phone: z.string().trim().max(20).nullish(),
  password: z.string().trim().max(255).optional(),
  roleId: z.uuid().nullish(),
  employeeId: z.uuid().nullish(),
  companyUsers: z.array(CompanyUserItemSchema).optional(),
});

export const UpdateUserSchema = BaseUpdateSchema.extend({
  username: z.string().trim().max(100).nullish(),
  email: z.string().trim().email().max(255).nullish(),
  phone: z.string().trim().max(20).nullish(),
  name: z.string().trim().max(255).optional(),
  isActive: z.boolean().nullish(),
  roleId: z.uuid().nullish(),
  employeeId: z.uuid().nullish(),
  companyUsers: z.array(CompanyUserItemSchema).optional(),
});

export const UserQuerySchema = BaseQuerySchema.extend({});

export const UserParamsSchema = BaseParamsSchema;

export const AssignCompanyUserSchema = z.object({
  roleId: z.uuid().nullish(),
  employeeId: z.uuid().nullish(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserQueryDto = z.infer<typeof UserQuerySchema>;
export type UserParamsDto = z.infer<typeof UserParamsSchema>;
export type AssignCompanyUserDto = z.infer<typeof AssignCompanyUserSchema>;
