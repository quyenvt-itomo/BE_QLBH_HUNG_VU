import { injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { InventoryAdjustmentService } from "./inventoryAdjustment.service";

@injectable()
export class InventoryAdjustmentController extends BaseController<InventoryAdjustment> {
  protected service: InventoryAdjustmentService;
  constructor(service: InventoryAdjustmentService) { super(); this.service = service; }
}
