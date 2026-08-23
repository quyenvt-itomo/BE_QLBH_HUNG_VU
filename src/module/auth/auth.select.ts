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

export const AuthSelectFull: FindOptionsSelect<User> = {
  ...AuthSelectBasic,
  password: true,
  storeUsers: true,
};

export const AuthRelations: FindOptionsRelations<User> = {
  storeUsers: {
    store: true,
  },
};
