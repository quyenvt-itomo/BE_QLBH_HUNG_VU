import { BaseRepository } from "@/shared/base/BaseRepository";
import { injectable } from "inversify";
import {
  InventoryAdjustmentLineSelectFull,
  InventoryAdjustmentLineRelations,
} from "./inventoryAdjustmentLine.select";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";

/**
 * InventoryAdjustmentLine Repository - Tenant Entity
 */
@injectable()
export class InventoryAdjustmentLineRepository extends BaseRepository<InventoryAdjustmentLine> {
  protected entityClass = InventoryAdjustmentLine;
  protected selectedFields = InventoryAdjustmentLineSelectFull;
  protected relations = InventoryAdjustmentLineRelations;
}
