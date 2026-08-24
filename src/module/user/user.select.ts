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
  roleId: true,
  role: { id: true, type: true, name: true },
};
export const UserSelectList = UserSelectBasic;

export const UserSelectFull: FindOptionsSelect<User> = {
  ...UserSelectBasic,
  password: true,
  storeUsers: {
    id: true,
    storeId: true,
    userId: true,
    store: { id: true, code: true, name: true, phone: true, isActive: true },
  },
};

export const UserRelations: FindOptionsRelations<User> = {
  role: true,
  storeUsers: { store: true },
};
export const UserRelationsList: FindOptionsRelations<User> = {
  role: true,
};
