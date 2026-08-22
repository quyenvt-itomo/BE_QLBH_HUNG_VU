import { Router } from "express";
import { injectable, inject } from "inversify";
import { InventoryAdjustmentLineController } from "./inventoryAdjustmentLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateInventoryAdjustmentLineSchema,
  UpdateInventoryAdjustmentLineSchema,
  InventoryAdjustmentLineParamsSchema,
  InventoryAdjustmentLineCreateParamsSchema,
} from "./inventoryAdjustmentLine.validator";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "./inventoryAdjustmentLine.types";

@injectable()
export class InventoryAdjustmentLineRouter {
  private router: Router;

  constructor(
    @inject(INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineController)
    private controller: InventoryAdjustmentLineController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /line - Create new line
    this.router.post(
      "/",
      zodValidate(InventoryAdjustmentLineCreateParamsSchema, "params"),
      zodValidate(CreateInventoryAdjustmentLineSchema, "body"),
      this.controller.create,
    );

    // PUT /line/:id - Update line
    this.router.put(
      "/:id",
      zodValidate(InventoryAdjustmentLineParamsSchema, "params"),
      zodValidate(UpdateInventoryAdjustmentLineSchema, "body"),
      this.controller.update,
    );

    // DELETE /line/:id - Delete line
    this.router.delete(
      "/:id",
      zodValidate(InventoryAdjustmentLineParamsSchema, "params"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
