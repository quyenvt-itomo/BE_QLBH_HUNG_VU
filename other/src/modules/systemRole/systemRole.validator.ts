import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { getPermissionContext } from "@/shared/middleware/permission.middleware";
import { z } from "zod";

const {
  modules,
  permissions,
  readOnlyModules = [],
  emptyPermissions,
} = getPermissionContext("system");

const PermissionStructureSchema = z
  .record(z.string(), z.array(z.string()))
  .transform((obj) => {
    const result: Record<string, string[]> = {};

    Object.entries(obj).forEach(([module, perms]) => {
      // Ignore unknown modules instead of throwing validation errors.
      if (!modules.includes(module as any)) return;

      const cleanedPerms = perms.filter((perm) =>
        permissions.includes(perm as any),
      );

      if (readOnlyModules.includes(module as any)) {
        // Read-only modules only keep read if provided.
        result[module] = cleanedPerms.includes("read") ? ["read"] : [];
        return;
      }

      result[module] = cleanedPerms;
    });

    return result;
  });

export const CreateRoleSchema = BaseCreateSchema.extend({
  name: z.string().nonempty(),
  permissions: PermissionStructureSchema.optional().default(emptyPermissions),
});

export const UpdateRoleSchema = BaseUpdateSchema.extend({
  name: z.string().optional(),
  permissions: PermissionStructureSchema.optional(),
});

export const RoleQuerySchema = z.object({});
export const RoleParamsSchema = BaseParamsSchema;

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
export type RoleQueryDto = z.infer<typeof RoleQuerySchema>;
export type RoleParamsDto = z.infer<typeof RoleParamsSchema>;
