import { User } from "@/database/models/User";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const AuthSelectLite: FindOptionsSelect<User> = {
  ...BaseSelect,
  username: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  dob: true,
  gender: true,
  isActive: true,
  systemRoleId: true,
};

export const AuthSelectBasic: FindOptionsSelect<User> = {
  ...AuthSelectLite,
};

export const AuthSelectFull: FindOptionsSelect<User> = {
  ...AuthSelectBasic,
  password: true,
  storeUsers: true,
  systemRole: true,
};

export const AuthRelations: FindOptionsRelations<User> = {
  storeUsers: {
    store: true,
    role: true,
  },
  systemRole: true,
};
