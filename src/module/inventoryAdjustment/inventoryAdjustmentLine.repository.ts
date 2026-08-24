import { injectable } from "inversify";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { InventoryAdjustmentLineRelations, InventoryAdjustmentLineRelationsList, InventoryAdjustmentLineSelectFull, InventoryAdjustmentLineSelectList } from "./inventoryAdjustmentLine.select";
@injectable()
export class InventoryAdjustmentLineRepository extends BaseRepository<InventoryAdjustmentLine> {
  protected entityClass = InventoryAdjustmentLine;
  protected selectedFields = InventoryAdjustmentLineSelectFull;
  protected selectedFieldsForList = InventoryAdjustmentLineSelectList;
  protected relations = InventoryAdjustmentLineRelations;
  protected relationsForList = InventoryAdjustmentLineRelationsList;
}
