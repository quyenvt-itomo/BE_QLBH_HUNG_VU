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
  notInStoreModules,
  readOnlyModules,
  emptyPermissions,
} = getPermissionContext("store");

// Schema validate toàn bộ permissions structure
const PermissionStructureSchema = z
  .record(z.string(), z.array(z.string()))
  .transform((permissionsObj) => {
    const result: Record<string, string[]> = {};

    Object.entries(permissionsObj).forEach(([key, perms]) => {
      // ❌ bỏ module không hợp lệ
      if (!modules.includes(key as any)) return;
      if (notInStoreModules?.includes(key as any)) return;

      let cleaned = perms.filter((perm) => permissions.includes(perm as any));

      // 🔥 xử lý read-only
      if (readOnlyModules?.includes(key as any)) {
        cleaned = cleaned.includes("read") ? ["read"] : [];
      }

      result[key] = cleaned;
    });

    return result;
  });

export const CreateRoleSchema = BaseCreateSchema.extend({
  name: z.string().nonempty(),
  storeId: z.uuid(),
  permissions: PermissionStructureSchema.optional().default(emptyPermissions),
});

export const UpdateRoleSchema = BaseUpdateSchema.extend({
  name: z.string().optional(),
  storeId: z.uuid(),
  permissions: PermissionStructureSchema.optional(),
});

export const RoleQuerySchema = z.object({
  storeId: z.uuid(),
});

export const RoleParamsSchema = BaseParamsSchema;

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
export type RoleQueryDto = z.infer<typeof RoleQuerySchema>;
export type RoleParamsDto = z.infer<typeof RoleParamsSchema>;
