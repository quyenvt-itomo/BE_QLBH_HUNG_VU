import { Router } from "express";
import { injectable, inject } from "inversify";
import { ProductionController } from "./production.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateProductionSchema,
  UpdateProductionSchema,
  ProductionQuerySchema,
  ProductionParamsSchema,
} from "./production.validator";
import { PRODUCTION_TYPES } from "./production.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ProductionRouter {
  private router: Router;

  constructor(
    @inject(PRODUCTION_TYPES.ProductionController)
    private controller: ProductionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ProductionQuerySchema, "query"),
      permissionMiddleware("production", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateProductionSchema, "body"),
      permissionMiddleware("production", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(ProductionParamsSchema, "params"),
      permissionMiddleware("production", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(ProductionParamsSchema, "params"),
      zodValidate(UpdateProductionSchema, "body"),
      permissionMiddleware("production", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(ProductionParamsSchema, "params"),
      permissionMiddleware("production", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/start",
      zodValidate(ProductionParamsSchema, "params"),
      permissionMiddleware("production", "update"),
      this.controller.start,
    );

    this.router.post(
      "/:id/complete",
      zodValidate(ProductionParamsSchema, "params"),
      permissionMiddleware("production", "complete"),
      this.controller.complete,
    );

    this.router.post(
      "/:id/cancel",
      zodValidate(ProductionParamsSchema, "params"),
      permissionMiddleware("production", "update"),
      this.controller.cancel,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
