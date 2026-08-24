import { DeepPartial } from "typeorm";
import { User } from "../models/User";

export const adminSeeder: DeepPartial<User> = {
  code: "ADMINSTRATOR",
  username: "admin",
  name: "Quản trị hệ thống",
  email: null,
  phone: null,
  isActive: true,
  isDefault: true,
};
