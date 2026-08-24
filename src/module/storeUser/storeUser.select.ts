import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { StoreUser } from "@/database/models/store/StoreUser";

export const StoreUserSelectList: FindOptionsSelect<StoreUser> = {
  ...BaseSelect, storeId: true, userId: true,
  store: { id: true, code: true, name: true },
  user: { id: true, code: true, name: true, username: true, roleId: true, isActive: true },
};
export const StoreUserSelectFull: FindOptionsSelect<StoreUser> = {
  ...StoreUserSelectList,
  store: { id: true, code: true, name: true },
  user: { id: true, code: true, name: true, username: true, roleId: true, isActive: true },
} as any;
export const StoreUserRelationsList: FindOptionsRelations<StoreUser> = { store: true, user: true };
export const StoreUserRelations: FindOptionsRelations<StoreUser> = StoreUserRelationsList;
