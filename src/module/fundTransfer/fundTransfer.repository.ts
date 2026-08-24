import { injectable } from "inversify";
import { FundTransfer } from "@/database/models/FundTransfer";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { FundTransferRelations, FundTransferRelationsList, FundTransferSelectFull, FundTransferSelectList } from "./fundTransfer.select";
@injectable()
export class FundTransferRepository extends BaseRepository<FundTransfer> {
  protected entityClass = FundTransfer;
  protected selectedFields = FundTransferSelectFull;
  protected selectedFieldsForList = FundTransferSelectList;
  protected relations = FundTransferRelations;
  protected relationsForList = FundTransferRelationsList;
}
