import { StoreUser } from "@/database/models/store/StoreUser";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const StoreUserSelectBasic: FindOptionsSelect<StoreUser> = {
  ...BaseSelect,
  userId: true,
  storeId: true,
  roleId: true,
};

export const StoreUserSelectFull: FindOptionsSelect<StoreUser> = {
  ...StoreUserSelectBasic,
  user: true,
  store: true,
  role: true,
};

export const StoreUserRelations: FindOptionsRelations<StoreUser> = {
  user: true,
  store: true,
  role: true,
};
