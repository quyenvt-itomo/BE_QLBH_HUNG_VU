import { DeepPartial } from "typeorm";
import { Role, RoleType } from "../models/Role";
import { createPermissions, MODULES } from "@/shared/middleware/permission.middleware";
import { EXCEL_MODULES } from "@/shared/types/excel";

export const roleSeeders: DeepPartial<Role>[] = [
  {
    name: "Quản trị hệ thống",
    type: RoleType.SYSTEM,
    permissions: createPermissions(),
    importExcel: [...EXCEL_MODULES],
    exportExcel: [...EXCEL_MODULES],
    isDefault: true,
  },
  {
    name: "Quản lý cửa hàng",
    type: RoleType.STORE,
    permissions: createPermissions(),
    importExcel: [...EXCEL_MODULES],
    exportExcel: [...EXCEL_MODULES],
    isDefault: false,
  },
  {
    name: "Nhân viên cửa hàng",
    type: RoleType.STORE,
    permissions: createPermissions("empty"),
    importExcel: [],
    exportExcel: [],
    isDefault: false,
  },
];

export { MODULES };
