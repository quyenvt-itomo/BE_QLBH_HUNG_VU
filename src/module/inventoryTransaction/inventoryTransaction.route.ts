import { InventoryTransactionController } from "./inventoryTransaction.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class InventoryTransactionRouter { constructor(private readonly controller: InventoryTransactionController) {} getRouter() { return simpleRoutes(this.controller, "inventoryReport"); } }
