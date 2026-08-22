import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreUserSelectFull, StoreUserRelations } from "./storeUser.select";
import { StoreUser } from "@/database/models/store/StoreUser";

export class StoreUserRepository extends BaseRepository<StoreUser> {
  protected entityClass = StoreUser;
  protected selectedFields = StoreUserSelectFull;
  protected relations = StoreUserRelations;
}
