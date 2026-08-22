import { injectable, inject } from "inversify";
import { InventoryAdjustmentLineService } from "./inventoryAdjustmentLine.service";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryAdjustmentLine } from "@/database/models/company/InventoryAdjustmentLine";

@injectable()
export class InventoryAdjustmentLineController extends BaseController<InventoryAdjustmentLine> {
  protected service: InventoryAdjustmentLineService;

  constructor(
    @inject(INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineService)
    service: InventoryAdjustmentLineService,
  ) {
    super();
    this.service = service;
  }
}
