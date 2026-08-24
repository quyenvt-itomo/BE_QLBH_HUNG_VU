import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { InventoryTransactionController } from "./inventoryTransaction.controller";
import { INVENTORY_TRANSACTION_TYPES } from "./inventoryTransaction.types";
@injectable()
export class InventoryTransactionRouter { private router = Router(); constructor(@inject(INVENTORY_TRANSACTION_TYPES.Controller) controller: InventoryTransactionController) { this.router.get("/", permissionMiddleware("inventoryReport", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("inventoryReport", "read"), controller.getById); } getRouter() { return this.router; } }
