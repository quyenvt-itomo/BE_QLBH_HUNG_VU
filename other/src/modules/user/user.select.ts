import { User } from "@/database/models/User";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const UserSelectBasic: FindOptionsSelect<User> = {
  ...BaseSelect,
  name: true,
  email: true,
  phone: true,
  address: true,
  dob: true,
  gender: true,
  isActive: true,
  systemRoleId: true,
  employeeId: true,
};

export const UserSelectFull: FindOptionsSelect<User> = {
  ...UserSelectBasic,
  password: true,
  storeUsers: true,
  systemRole: true,
  employee: true,
};

export const UserRelations: FindOptionsRelations<User> = {
  storeUsers: {
    store: {
      roles: true,
    },
    role: true,
  },
  systemRole: true,
  employee: true,
};
