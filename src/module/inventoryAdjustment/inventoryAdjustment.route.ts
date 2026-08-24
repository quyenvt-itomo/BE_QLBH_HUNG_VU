import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { InventoryAdjustmentController } from "./inventoryAdjustment.controller";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
@injectable()
export class InventoryAdjustmentRouter { private router = Router(); constructor(@inject(INVENTORY_ADJUSTMENT_TYPES.Controller) controller: InventoryAdjustmentController) { this.router.get("/", permissionMiddleware("inventoryAdjustment", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("inventoryAdjustment", "read"), controller.getById); this.router.post("/", permissionMiddleware("inventoryAdjustment", "create"), controller.create); this.router.put("/:id", permissionMiddleware("inventoryAdjustment", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("inventoryAdjustment", "delete"), controller.delete); } getRouter() { return this.router; } }
