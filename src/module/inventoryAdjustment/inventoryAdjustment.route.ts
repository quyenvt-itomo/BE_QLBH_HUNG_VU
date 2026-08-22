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

@injectable()
export class InventoryAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentController)
    private controller: InventoryAdjustmentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(InventoryAdjustmentQuerySchema, "query"),
      permissionMiddleware("inventoryAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateInventoryAdjustmentSchema, "body"),
      permissionMiddleware("inventoryAdjustment", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(InventoryAdjustmentParamsSchema, "params"),
      permissionMiddleware("inventoryAdjustment", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(InventoryAdjustmentParamsSchema, "params"),
      zodValidate(UpdateInventoryAdjustmentSchema, "body"),
      permissionMiddleware("inventoryAdjustment", "update"),
      this.controller.update,
    );

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
