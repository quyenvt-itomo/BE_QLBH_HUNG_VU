import { DeepPartial } from "typeorm";
import { User } from "../models/User";

export const adminSeeders: DeepPartial<User>[] = [
  {
    code: "ADMINISTRATOR",
    username: "admin",
    name: "Administrator",
    isDefault: true,
  },
];
