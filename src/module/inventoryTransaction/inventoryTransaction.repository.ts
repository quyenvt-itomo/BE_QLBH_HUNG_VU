import { injectable } from "inversify";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { InventoryTransactionRelations, InventoryTransactionRelationsList, InventoryTransactionSelectFull, InventoryTransactionSelectList } from "./inventoryTransaction.select";
@injectable()
export class InventoryTransactionRepository extends BaseRepository<InventoryTransaction> {
  protected entityClass = InventoryTransaction;
  protected selectedFields = InventoryTransactionSelectFull;
  protected selectedFieldsForList = InventoryTransactionSelectList;
  protected relations = InventoryTransactionRelations;
  protected relationsForList = InventoryTransactionRelationsList;
}
