import { Router } from "express";
import { injectable, inject } from "inversify";
import { InventoryAdjustmentController } from "./inventoryAdjustment.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateInventoryAdjustmentSchema,
  UpdateInventoryAdjustmentSchema,
  InventoryAdjustmentQuerySchema,
  InventoryAdjustmentParamsSchema,
} from "./inventoryAdjustment.validator";
import { INVENTORY_ADJUSTMENT_TYPES } from "./inventoryAdjustment.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import {
  INVENTORY_ADJUSTMENT_LINE_TYPES,
  InventoryAdjustmentLineRouter,
} from "./inventoryAdjustmentLine";

@injectable()
export class InventoryAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentController)
    private controller: InventoryAdjustmentController,
    @inject(INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRouter)
    private adjustmentLineRouter: InventoryAdjustmentLineRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Nested line routes
    this.router.use(
      "/:adjustmentId/line",
      permissionMiddleware("inventoryAdjustment", "update"),
      this.controller.checkExits("adjustmentId"),
      this.adjustmentLineRouter.getRouter(),
    );

    // GET / - Get all adjustments with filters
    this.router.get(
      "/",
      zodValidate(InventoryAdjustmentQuerySchema, "query"),
      permissionMiddleware("inventoryAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    // POST / - Create new adjustment
    this.router.post(
      "/",
      zodValidate(CreateInventoryAdjustmentSchema, "body"),
      permissionMiddleware("inventoryAdjustment", "create"),
      this.controller.create,
    );

    // GET /:id - Get adjustment by ID
    this.router.get(
      "/:id",
      zodValidate(InventoryAdjustmentParamsSchema, "params"),
      permissionMiddleware("inventoryAdjustment", "read"),
      this.controller.getById,
    );

    // PUT /:id - Update adjustment
    this.router.put(
      "/:id",
      zodValidate(InventoryAdjustmentParamsSchema, "params"),
      zodValidate(UpdateInventoryAdjustmentSchema, "body"),
      permissionMiddleware("inventoryAdjustment", "update"),
      this.controller.update,
    );

    // DELETE /:id - Delete adjustment
    this.router.delete(
      "/:id",
      zodValidate(InventoryAdjustmentParamsSchema, "params"),
      permissionMiddleware("inventoryAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
