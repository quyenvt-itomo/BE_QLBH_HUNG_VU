import { Router } from "express";
import { injectable, inject } from "inversify";
import { PurchaseLineController } from "./purchaseLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePurchaseLineSchema,
  UpdatePurchaseLineSchema,
  PurchaseLineQuerySchema,
  PurchaseLineParamsSchema,
} from "./purchaseLine.validator";
import { PURCHASE_LINE_TYPES } from "./purchaseLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PurchaseLineRouter {
  private router: Router;

  constructor(
    @inject(PURCHASE_LINE_TYPES.PurchaseLineController)
    private controller: PurchaseLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PurchaseLineQuerySchema, "query"),
      permissionMiddleware("purchase", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePurchaseLineSchema, "body"),
      permissionMiddleware("purchase", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PurchaseLineParamsSchema, "params"),
      permissionMiddleware("purchase", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PurchaseLineParamsSchema, "params"),
      zodValidate(UpdatePurchaseLineSchema, "body"),
      permissionMiddleware("purchase", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PurchaseLineParamsSchema, "params"),
      permissionMiddleware("purchase", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
