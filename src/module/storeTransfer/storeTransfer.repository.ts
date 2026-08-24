import { injectable } from "inversify";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreTransferRelations, StoreTransferRelationsList, StoreTransferSelectFull, StoreTransferSelectList } from "./storeTransfer.select";
@injectable()
export class StoreTransferRepository extends BaseRepository<StoreTransfer> {
  protected entityClass = StoreTransfer;
  protected selectedFields = StoreTransferSelectFull;
  protected selectedFieldsForList = StoreTransferSelectList;
  protected relations = StoreTransferRelations;
  protected relationsForList = StoreTransferRelationsList;
}
