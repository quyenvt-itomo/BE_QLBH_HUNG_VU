import { Router } from "express";
import { injectable, inject } from "inversify";
import { PurchaseQuotationController } from "./purchaseQuotation.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePurchaseQuotationSchema,
  PurchaseQuotationQuerySchema,
  PurchaseQuotationParamsSchema,
  ApproveRejectSchema,
  PurchaseQuotationPublicParamsSchema,
} from "./purchaseQuotation.validator";
import { PURCHASE_QUOTATION_TYPES } from "./purchaseQuotation.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PurchaseQuotationRouter {
  private router: Router;

  constructor(
    @inject(PURCHASE_QUOTATION_TYPES.PurchaseQuotationController)
    private controller: PurchaseQuotationController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PurchaseQuotationQuerySchema, "query"),
      permissionMiddleware("purchaseQuotation", "read"),
      this.controller.getAllWithPagination,
    );

    // this.router.post(
    //   "/",
    //   zodValidate(CreatePurchaseQuotationSchema, "body"),
    //   permissionMiddleware("purchaseQuotation", "create"),
    //   this.controller.create,
    // );

    this.router.get(
      "/:id",
      zodValidate(PurchaseQuotationParamsSchema, "params"),
      permissionMiddleware("purchaseQuotation", "read"),
      this.controller.getById,
    );

    // this.router.put(
    //   "/:id",
    //   zodValidate(PurchaseQuotationParamsSchema, "params"),
    //   zodValidate(UpdatePurchaseQuotationSchema, "body"),
    //   permissionMiddleware("purchaseQuotation", "update"),
    //   this.controller.update,
    // );

    this.router.delete(
      "/:id",
      zodValidate(PurchaseQuotationParamsSchema, "params"),
      permissionMiddleware("purchaseQuotation", "delete"),
      this.controller.delete,
    );

    // Approve / Reject
    this.router.post(
      "/:id/approve",
      zodValidate(PurchaseQuotationParamsSchema, "params"),
      permissionMiddleware("purchaseQuotation", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(PurchaseQuotationParamsSchema, "params"),
      zodValidate(ApproveRejectSchema, "body"),
      permissionMiddleware("purchaseQuotation", "approve"),
      this.controller.reject,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  public getPublicRouter(): Router {
    const publicRouter = Router();
    publicRouter.post(
      "/",
      zodValidate(CreatePurchaseQuotationSchema, "body"),
      this.controller.create,
    );

    publicRouter.get(
      "/code/:code",
      zodValidate(PurchaseQuotationPublicParamsSchema, "params"),
      this.controller.getByCode,
    );

    return publicRouter;
  }
}
