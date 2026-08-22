import { Router } from "express";
import { injectable, inject } from "inversify";
import { ProductController } from "./product.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
  ProductParamsSchema,
} from "./product.validator";
import { PRODUCT_TYPES } from "./product.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ProductRouter {
  private router: Router;

  constructor(
    @inject(PRODUCT_TYPES.ProductController)
    private controller: ProductController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/price-history",
      zodValidate(ProductQuerySchema, "query"),
      permissionMiddleware("priceHistory", "read"),
      this.controller.getPriceHistories,
    );

    this.router.get(
      "/",
      zodValidate(ProductQuerySchema, "query"),
      permissionMiddleware("product", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateProductSchema, "body"),
      permissionMiddleware("product", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(ProductParamsSchema, "params"),
      permissionMiddleware("product", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(ProductParamsSchema, "params"),
      zodValidate(UpdateProductSchema, "body"),
      permissionMiddleware("product", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(ProductParamsSchema, "params"),
      permissionMiddleware("product", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }

  public getPublicRouter(): Router {
    const publicRouter = Router();
    publicRouter.get(
      "/",
      zodValidate(ProductQuerySchema, "query"),
      this.controller.getPublicProducts,
    );
    return publicRouter;
  }
}
