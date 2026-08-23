import { InventoryAdjustmentController } from "./inventoryAdjustment.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class InventoryAdjustmentRouter { constructor(private readonly controller: InventoryAdjustmentController) {} getRouter() { return simpleRoutes(this.controller, "inventoryAdjustment"); } }
