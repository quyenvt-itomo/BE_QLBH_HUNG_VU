import { injectable } from "inversify";
import { StoreUser } from "@/database/models/store/StoreUser";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreUserRelations, StoreUserRelationsList, StoreUserSelectFull, StoreUserSelectList } from "./storeUser.select";
@injectable()
export class StoreUserRepository extends BaseRepository<StoreUser> {
  protected entityClass = StoreUser;
  protected selectedFields = StoreUserSelectFull;
  protected selectedFieldsForList = StoreUserSelectList;
  protected relations = StoreUserRelations;
  protected relationsForList = StoreUserRelationsList;
}
