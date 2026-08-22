import { SystemRole } from "@/database/models/SystemRole";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const SystemRoleSelectBasic: FindOptionsSelect<SystemRole> = {
  ...BaseSelect,
  name: true,
  permissions: true,
};

export const SystemRoleSelectFull: FindOptionsSelect<SystemRole> = {
  ...SystemRoleSelectBasic,
};

export const SystemRoleRelations: FindOptionsRelations<SystemRole> = {};
