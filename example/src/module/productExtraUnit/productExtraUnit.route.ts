import { Router } from "express";
import { injectable, inject } from "inversify";
import { ProductExtraUnitController } from "./productExtraUnit.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateProductExtraUnitSchema,
  UpdateProductExtraUnitSchema,
  ProductExtraUnitQuerySchema,
  ProductExtraUnitParamsSchema,
} from "./productExtraUnit.validator";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ProductExtraUnitRouter {
  private router: Router;

  constructor(
    @inject(PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitController)
    private controller: ProductExtraUnitController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ProductExtraUnitQuerySchema, "query"),
      permissionMiddleware("product", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreateProductExtraUnitSchema, "body"),
      permissionMiddleware("product", "update"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(ProductExtraUnitParamsSchema, "params"),
      permissionMiddleware("product", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ProductExtraUnitParamsSchema, "params"),
      zodValidate(UpdateProductExtraUnitSchema, "body"),
      permissionMiddleware("product", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(ProductExtraUnitParamsSchema, "params"),
      permissionMiddleware("product", "update"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
