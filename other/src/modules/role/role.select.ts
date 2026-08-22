import { Role } from "@/database/models/store/Role";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const RoleSelectBasic: FindOptionsSelect<Role> = {
  ...BaseSelect,
  name: true,
  permissions: true,
  storeId: true,
};

export const RoleSelectFull: FindOptionsSelect<Role> = {
  ...RoleSelectBasic,
  store: true,
};

export const RoleRelations: FindOptionsRelations<Role> = {
  store: true,
};
