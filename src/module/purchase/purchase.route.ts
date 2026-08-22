import { Router } from "express";
import { injectable, inject } from "inversify";
import { PurchaseController } from "./purchase.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePurchaseSchema,
  UpdatePurchaseSchema,
  PurchaseQuerySchema,
  PurchaseParamsSchema,
  ApproveRejectSchema,
} from "./purchase.validator";
import { PURCHASE_TYPES } from "./purchase.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PurchaseRouter {
  private router: Router;

  constructor(
    @inject(PURCHASE_TYPES.PurchaseController)
    private controller: PurchaseController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/:id/approve",
      zodValidate(PurchaseParamsSchema, "params"),
      permissionMiddleware("purchase", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(PurchaseParamsSchema, "params"),
      zodValidate(ApproveRejectSchema, "body"),
      permissionMiddleware("purchase", "approve"),
      this.controller.reject,
    );

    this.router.post(
      "/:id/complete",
      zodValidate(PurchaseParamsSchema, "params"),
      permissionMiddleware("purchase", "complete"),
      this.controller.complete,
    );

    this.router.get(
      "/",
      zodValidate(PurchaseQuerySchema, "query"),
      permissionMiddleware("purchase", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePurchaseSchema, "body"),
      permissionMiddleware("purchase", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PurchaseParamsSchema, "params"),
      permissionMiddleware("purchase", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PurchaseParamsSchema, "params"),
      zodValidate(UpdatePurchaseSchema, "body"),
      permissionMiddleware("purchase", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PurchaseParamsSchema, "params"),
      permissionMiddleware("purchase", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
