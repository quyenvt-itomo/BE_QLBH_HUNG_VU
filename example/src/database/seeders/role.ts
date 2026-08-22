import {
  createPermissions,
  MODULES,
} from "@/shared/middleware/permission.middleware";
import { Role } from "../models/company/Role";
import { DeepPartial } from "typeorm";

export const roleSeeder: DeepPartial<Role>[] = [
  {
    name: "Quản trị viên",
    permissions: createPermissions(),
    isDefault: true,
    importExcel: [...MODULES],
    exportExcel: [...MODULES],
  },
  {
    name: "Nhân viên",
    permissions: createPermissions("empty"),
    isDefault: true,
  },
];
