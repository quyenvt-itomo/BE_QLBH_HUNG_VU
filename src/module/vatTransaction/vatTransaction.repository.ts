import { injectable } from "inversify";
import { VatTransaction } from "@/database/models/VatTransaction";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { VatTransactionRelations, VatTransactionRelationsList, VatTransactionSelectFull, VatTransactionSelectList } from "./vatTransaction.select";
@injectable()
export class VatTransactionRepository extends BaseRepository<VatTransaction> {
  protected entityClass = VatTransaction;
  protected selectedFields = VatTransactionSelectFull;
  protected selectedFieldsForList = VatTransactionSelectList;
  protected relations = VatTransactionRelations;
  protected relationsForList = VatTransactionRelationsList;
}
