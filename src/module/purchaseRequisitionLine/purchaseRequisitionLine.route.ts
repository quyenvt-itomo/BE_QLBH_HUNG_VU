import { Router } from "express";
import { injectable, inject } from "inversify";
import { PurchaseRequisitionLineController } from "./purchaseRequisitionLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePurchaseRequisitionLineSchema,
  UpdatePurchaseRequisitionLineSchema,
  PurchaseRequisitionLineQuerySchema,
  PurchaseRequisitionLineParamsSchema,
} from "./purchaseRequisitionLine.validator";
import { PURCHASE_REQUISITION_LINE_TYPES } from "./purchaseRequisitionLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PurchaseRequisitionLineRouter {
  private router: Router;

  constructor(
    @inject(PURCHASE_REQUISITION_LINE_TYPES.PurchaseRequisitionLineController)
    private controller: PurchaseRequisitionLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PurchaseRequisitionLineQuerySchema, "query"),
      permissionMiddleware("purchaseRequisition", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePurchaseRequisitionLineSchema, "body"),
      permissionMiddleware("purchaseRequisition", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PurchaseRequisitionLineParamsSchema, "params"),
      permissionMiddleware("purchaseRequisition", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PurchaseRequisitionLineParamsSchema, "params"),
      zodValidate(UpdatePurchaseRequisitionLineSchema, "body"),
      permissionMiddleware("purchaseRequisition", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PurchaseRequisitionLineParamsSchema, "params"),
      permissionMiddleware("purchaseRequisition", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
