import { Router } from "express";
import { injectable, inject } from "inversify";
import { LoyaltyPointAdjustmentController } from "./loyaltyPointAdjustment.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateLoyaltyPointAdjustmentSchema,
  UpdateLoyaltyPointAdjustmentSchema,
  LoyaltyPointAdjustmentQuerySchema,
  LoyaltyPointAdjustmentParamsSchema,
} from "./loyaltyPointAdjustment.validator";
import { LOYALTY_POINT_ADJUSTMENT_TYPES } from "./loyaltyPointAdjustment.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class LoyaltyPointAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(LOYALTY_POINT_ADJUSTMENT_TYPES.LoyaltyPointAdjustmentController)
    private controller: LoyaltyPointAdjustmentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /loyalty-point-adjustment - Get all adjustments with filters
    this.router.get(
      "/",
      zodValidate(LoyaltyPointAdjustmentQuerySchema, "query"),
      permissionMiddleware("loyaltyPointAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    // POST /loyalty-point-adjustment - Create new adjustment
    this.router.post(
      "/",
      zodValidate(CreateLoyaltyPointAdjustmentSchema, "body"),
      permissionMiddleware("loyaltyPointAdjustment", "create"),
      this.controller.create,
    );

    // GET /loyalty-point-adjustment/:id - Get adjustment by ID
    this.router.get(
      "/:id",
      zodValidate(LoyaltyPointAdjustmentParamsSchema, "params"),
      permissionMiddleware("loyaltyPointAdjustment", "read"),
      this.controller.getById,
    );

    // PUT /loyalty-point-adjustment/:id - Update adjustment
    this.router.put(
      "/:id",
      zodValidate(LoyaltyPointAdjustmentParamsSchema, "params"),
      zodValidate(UpdateLoyaltyPointAdjustmentSchema, "body"),
      permissionMiddleware("loyaltyPointAdjustment", "update"),
      this.controller.update,
    );

    // DELETE /loyalty-point-adjustment/:id - Delete adjustment
    this.router.delete(
      "/:id",
      zodValidate(LoyaltyPointAdjustmentParamsSchema, "params"),
      permissionMiddleware("loyaltyPointAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
