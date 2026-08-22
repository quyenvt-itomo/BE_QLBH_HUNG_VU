import { Router } from "express";
import { injectable, inject } from "inversify";
import { ShippingPlanController } from "./shippingPlan.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateShippingPlanSchema,
  UpdateShippingPlanSchema,
  ShippingPlanQuerySchema,
  ShippingPlanParamsSchema,
  RejectShippingPlanSchema,
} from "./shippingPlan.validator";
import { SHIPPING_PLAN_TYPES } from "./shippingPlan.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ShippingPlanRouter {
  private router: Router;

  constructor(
    @inject(SHIPPING_PLAN_TYPES.ShippingPlanController)
    private controller: ShippingPlanController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ShippingPlanQuerySchema, "query"),
      permissionMiddleware("shippingPlan", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateShippingPlanSchema, "body"),
      permissionMiddleware("shippingPlan", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(ShippingPlanParamsSchema, "params"),
      permissionMiddleware("shippingPlan", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(ShippingPlanParamsSchema, "params"),
      zodValidate(UpdateShippingPlanSchema, "body"),
      permissionMiddleware("shippingPlan", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(ShippingPlanParamsSchema, "params"),
      permissionMiddleware("shippingPlan", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/approve",
      zodValidate(ShippingPlanParamsSchema, "params"),
      permissionMiddleware("shippingPlan", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(ShippingPlanParamsSchema, "params"),
      zodValidate(RejectShippingPlanSchema, "body"),
      permissionMiddleware("shippingPlan", "approve"),
      this.controller.reject,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
