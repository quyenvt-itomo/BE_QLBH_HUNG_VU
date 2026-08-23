import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryAdjustmentLineRepository } from "./inventoryAdjustmentLine.repository";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";

@injectable()
export class InventoryAdjustmentLineService extends BaseService<InventoryAdjustmentLine> {
  protected repository: InventoryAdjustmentLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRepository)
    repository: InventoryAdjustmentLineRepository,
  ) {
    super();
    this.repository = repository;
  }
}
