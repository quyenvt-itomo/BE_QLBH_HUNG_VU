import { Router } from "express";
import { injectable, inject } from "inversify";
import { PurchaseRequisitionController } from "./purchaseRequisition.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePurchaseRequisitionSchema,
  UpdatePurchaseRequisitionSchema,
  PurchaseRequisitionQuerySchema,
  PurchaseRequisitionParamsSchema,
  RejectPurchaseRequisitionSchema,
} from "./purchaseRequisition.validator";
import { PURCHASE_REQUISITION_TYPES } from "./purchaseRequisition.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PurchaseRequisitionRouter {
  private router: Router;

  constructor(
    @inject(PURCHASE_REQUISITION_TYPES.PurchaseRequisitionController)
    private controller: PurchaseRequisitionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PurchaseRequisitionQuerySchema, "query"),
      permissionMiddleware("purchaseRequisition", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePurchaseRequisitionSchema, "body"),
      permissionMiddleware("purchaseRequisition", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PurchaseRequisitionParamsSchema, "params"),
      permissionMiddleware("purchaseRequisition", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PurchaseRequisitionParamsSchema, "params"),
      zodValidate(UpdatePurchaseRequisitionSchema, "body"),
      permissionMiddleware("purchaseRequisition", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PurchaseRequisitionParamsSchema, "params"),
      permissionMiddleware("purchaseRequisition", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/approve",
      zodValidate(PurchaseRequisitionParamsSchema, "params"),
      permissionMiddleware("purchaseRequisition", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(PurchaseRequisitionParamsSchema, "params"),
      zodValidate(RejectPurchaseRequisitionSchema, "body"),
      permissionMiddleware("purchaseRequisition", "approve"),
      this.controller.reject,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
