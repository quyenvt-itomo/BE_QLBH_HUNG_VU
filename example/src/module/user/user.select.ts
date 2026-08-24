import { User } from "@/database/models/User";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const UserSelectBasic: FindOptionsSelect<User> = {
  ...BaseSelect,
  code: true,
  username: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  sourceStoreId: true,
};

export const UserSelectFull: FindOptionsSelect<User> = {
  ...UserSelectBasic,
  password: true,
  sourceStore: true,
  companyUsers: true,
};

export const UserRelations: FindOptionsRelations<User> = {
  companyUsers: {
    company: true,
    role: true,
    employee: true,
  },
  sourceStore: true,
};
