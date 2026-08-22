import { Router } from "express";
import { injectable, inject } from "inversify";
import { PurchaseQuotationLineController } from "./purchaseQuotationLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePurchaseQuotationLineSchema,
  UpdatePurchaseQuotationLineSchema,
  PurchaseQuotationLineQuerySchema,
  PurchaseQuotationLineParamsSchema,
} from "./purchaseQuotationLine.validator";
import { PURCHASE_QUOTATION_LINE_TYPES } from "./purchaseQuotationLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PurchaseQuotationLineRouter {
  private router: Router;

  constructor(
    @inject(PURCHASE_QUOTATION_LINE_TYPES.PurchaseQuotationLineController)
    private controller: PurchaseQuotationLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PurchaseQuotationLineQuerySchema, "query"),
      permissionMiddleware("purchaseQuotation", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePurchaseQuotationLineSchema, "body"),
      permissionMiddleware("purchaseQuotation", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PurchaseQuotationLineParamsSchema, "params"),
      permissionMiddleware("purchaseQuotation", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PurchaseQuotationLineParamsSchema, "params"),
      zodValidate(UpdatePurchaseQuotationLineSchema, "body"),
      permissionMiddleware("purchaseQuotation", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PurchaseQuotationLineParamsSchema, "params"),
      permissionMiddleware("purchaseQuotation", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
