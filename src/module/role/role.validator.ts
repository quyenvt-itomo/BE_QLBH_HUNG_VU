import { z } from "zod";
import {
  BaseCreateSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { RoleType } from "@/database/models/Role";
import { EXCEL_MODULES } from "@/shared/types/excel";

const PermissionSchema = z.record(
  z.string(),
  z.array(
    z.enum(["create", "read", "update", "delete", "approve", "complete"]),
  ),
);

const ExcelPermissionModulesSchema = z.array(z.enum(EXCEL_MODULES)).default([]);

export const CreateRoleSchema = BaseCreateSchema.extend({
  name: z.string().trim().min(1).max(255),
  type: z.enum(RoleType).optional(),
  permissions: PermissionSchema.optional().default({}),
  importExcel: ExcelPermissionModulesSchema,
  exportExcel: ExcelPermissionModulesSchema,
});

export const UpdateRoleSchema = BaseUpdateSchema.extend({
  name: z.string().trim().min(1).max(255).optional(),
  type: z.enum(RoleType).optional(),
  permissions: PermissionSchema.optional(),
  importExcel: ExcelPermissionModulesSchema.optional(),
  exportExcel: ExcelPermissionModulesSchema.optional(),
});

export const RoleQuerySchema = BaseQuerySchema;
