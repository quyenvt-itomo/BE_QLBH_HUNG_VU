import { injectable } from "inversify";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { InventoryAdjustmentRelations, InventoryAdjustmentRelationsList, InventoryAdjustmentSelectFull, InventoryAdjustmentSelectList } from "./inventoryAdjustment.select";
@injectable()
export class InventoryAdjustmentRepository extends BaseRepository<InventoryAdjustment> {
  protected entityClass = InventoryAdjustment;
  protected selectedFields = InventoryAdjustmentSelectFull;
  protected selectedFieldsForList = InventoryAdjustmentSelectList;
  protected relations = InventoryAdjustmentRelations;
  protected relationsForList = InventoryAdjustmentRelationsList;
}
