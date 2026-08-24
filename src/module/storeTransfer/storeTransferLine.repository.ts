import { injectable } from "inversify";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { StoreTransferLineRelations, StoreTransferLineRelationsList, StoreTransferLineSelectFull, StoreTransferLineSelectList } from "./storeTransferLine.select";
@injectable()
export class StoreTransferLineRepository extends BaseRepository<StoreTransferLine> {
  protected entityClass = StoreTransferLine;
  protected selectedFields = StoreTransferLineSelectFull;
  protected selectedFieldsForList = StoreTransferLineSelectList;
  protected relations = StoreTransferLineRelations;
  protected relationsForList = StoreTransferLineRelationsList;
}
