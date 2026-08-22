import { z } from "zod";
import {
  BaseQuerySchema,
  BaseParamsSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";

export const CreateRoleSchema = BaseCreateSchema.extend({
  companyId: z.uuid(),
  name: z.string().trim().max(255),
  permissions: z
    .record(z.string().trim(), z.array(z.string().trim()).optional())
    .optional(),
  importExcel: z.array(z.string().trim()).optional(),
  exportExcel: z.array(z.string().trim()).optional(),
});

export const UpdateRoleSchema = BaseUpdateSchema.extend({
  name: z.string().trim().max(255).optional(),
  permissions: z
    .record(z.string().trim(), z.array(z.string().trim()).optional())
    .optional(),
  importExcel: z.array(z.string().trim()).optional(),
  exportExcel: z.array(z.string().trim()).optional(),
});

export const RoleQuerySchema = BaseQuerySchema;

export const RoleParamsSchema = BaseParamsSchema;

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
export type RoleQueryDto = z.infer<typeof RoleQuerySchema>;
export type RoleParamsDto = z.infer<typeof RoleParamsSchema>;
