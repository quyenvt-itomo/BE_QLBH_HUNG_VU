import { DeepPartial } from "typeorm";
import { Role, RoleType } from "../models/Role";
import { createPermissions, MODULES } from "@/shared/middleware/permission.middleware";

export const roleSeeders: DeepPartial<Role>[] = [
  {
    name: "Quản trị hệ thống",
    type: RoleType.SYSTEM,
    permissions: createPermissions(),
    isDefault: true,
  },
  {
    name: "Quản lý cửa hàng",
    type: RoleType.STORE,
    permissions: createPermissions(),
    isDefault: false,
  },
  {
    name: "Nhân viên cửa hàng",
    type: RoleType.STORE,
    permissions: createPermissions("empty"),
    isDefault: false,
  },
];

export { MODULES };
