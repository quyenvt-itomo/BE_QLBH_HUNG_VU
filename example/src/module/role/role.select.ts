import { Role } from "@/database/models/company/Role";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const RoleSelectBasic: FindOptionsSelect<Role> = {
  ...BaseSelect,
  name: true,
  permissions: true,
  companyId: true,
  importExcel: true,
  exportExcel: true,
};

export const RoleSelectFull: FindOptionsSelect<Role> = {
  ...RoleSelectBasic,
  company: true,
};

export const RoleRelations: FindOptionsRelations<Role> = {
  company: true,
};
