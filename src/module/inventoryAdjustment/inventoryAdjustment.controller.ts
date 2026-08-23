import { injectable, inject } from "inversify";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";

@injectable()
export class InventoryAdjustmentController extends BaseController<InventoryAdjustment> {
  protected service: InventoryAdjustmentService;

  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentService)
    service: InventoryAdjustmentService,
  ) {
    super();
    this.service = service;
  }
}
