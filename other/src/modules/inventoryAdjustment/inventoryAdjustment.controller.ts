import { BaseController } from "@/shared/base/BaseController";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { inject, injectable } from "inversify";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";

/**
 * InventoryAdjustment Controller - Tenant Entity
 */
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
