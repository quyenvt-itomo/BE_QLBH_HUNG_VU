import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreSelectFull, StoreRelations } from "./store.select";
import { Store } from "@/database/models/Store";

export class StoreRepository extends BaseRepository<Store> {
  protected entityClass = Store;
  protected selectedFields = StoreSelectFull;
  protected relations = StoreRelations;
}
