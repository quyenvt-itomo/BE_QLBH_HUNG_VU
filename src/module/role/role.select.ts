import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { Role } from "@/database/models/Role";

export const RoleSelectList: FindOptionsSelect<Role> = {
  ...BaseSelect,
  type: true,
  name: true,
  permissions: true,
  importExcel: true,
  exportExcel: true,
};
export const RoleSelectFull: FindOptionsSelect<Role> = {
  ...RoleSelectList,
  users: { id: true, code: true, name: true, username: true, email: true, phone: true, isActive: true },
} as any;
export const RoleRelationsList: FindOptionsRelations<Role> = {};
export const RoleRelations: FindOptionsRelations<Role> = { users: true };
