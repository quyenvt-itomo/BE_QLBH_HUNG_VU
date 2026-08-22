import { Router } from "express";
import { injectable, inject } from "inversify";
import { InventoryAdjustmentLineController } from "./inventoryAdjustmentLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateInventoryAdjustmentLineSchema,
  UpdateInventoryAdjustmentLineSchema,
  InventoryAdjustmentLineQuerySchema,
  InventoryAdjustmentLineParamsSchema,
} from "./inventoryAdjustmentLine.validator";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class InventoryAdjustmentLineRouter {
  private router: Router;

  constructor(
    @inject(INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineController)
    private controller: InventoryAdjustmentLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(InventoryAdjustmentLineQuerySchema, "query"),
      permissionMiddleware("inventoryAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateInventoryAdjustmentLineSchema, "body"),
      permissionMiddleware("inventoryAdjustment", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(InventoryAdjustmentLineParamsSchema, "params"),
      permissionMiddleware("inventoryAdjustment", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(InventoryAdjustmentLineParamsSchema, "params"),
      zodValidate(UpdateInventoryAdjustmentLineSchema, "body"),
      permissionMiddleware("inventoryAdjustment", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(InventoryAdjustmentLineParamsSchema, "params"),
      permissionMiddleware("inventoryAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
