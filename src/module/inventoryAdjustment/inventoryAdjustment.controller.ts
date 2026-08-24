import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";

@injectable()
export class InventoryAdjustmentController extends BaseController<InventoryAdjustment> {
  protected service: InventoryAdjustmentService;
  constructor(@inject(INVENTORY_ADJUSTMENT_TYPES.Service) service: InventoryAdjustmentService) { super(); this.service = service; }
}
