import { User } from "@/database/models/User";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const AuthSelectBasic: FindOptionsSelect<User> = {
  ...BaseSelect,
  code: true,
  username: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
};
export const AuthSelectList = AuthSelectBasic;

export const AuthSelectFull: FindOptionsSelect<User> = {
  ...AuthSelectBasic,
  password: true,
  role: {
    id: true,
    type: true,
    name: true,
    permissions: true,
    importExcel: true,
    exportExcel: true,
  },
  storeUsers: {
    id: true,
    storeId: true,
    userId: true,
    store: { id: true, code: true, name: true, phone: true, isActive: true },
  },
} as any;

export const AuthRelations: FindOptionsRelations<User> = {
  storeUsers: {
    store: true,
  },
};
export const AuthRelationsList: FindOptionsRelations<User> = {};
