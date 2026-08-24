import { injectable } from "inversify";
import { FundTransaction } from "@/database/models/FundTransaction";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { FundTransactionRelations, FundTransactionRelationsList, FundTransactionSelectFull, FundTransactionSelectList } from "./fundTransaction.select";
@injectable()
export class FundTransactionRepository extends BaseRepository<FundTransaction> {
  protected entityClass = FundTransaction;
  protected selectedFields = FundTransactionSelectFull;
  protected selectedFieldsForList = FundTransactionSelectList;
  protected relations = FundTransactionRelations;
  protected relationsForList = FundTransactionRelationsList;
}
