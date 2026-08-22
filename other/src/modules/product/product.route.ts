import { Router } from "express";
import { injectable, inject } from "inversify";
import { ProductController } from "./product.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
  ProductParamsSchema,
  ProductChildParamsSchema,
  GetByBarcodeSchema,
  ProductDeleteManyQuery,
} from "./product.validator";
import { PRODUCT_TYPES } from "./product.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { PRODUCT_OPTION_TYPES, ProductOptionRouter } from "./productOption";
import { PRODUCT_VARIANT_TYPES, ProductVariantRouter } from "./productVariant";

@injectable()
export class ProductRouter {
  private router: Router;

  constructor(
    @inject(PRODUCT_TYPES.ProductController)
    private productController: ProductController,
    @inject(PRODUCT_OPTION_TYPES.ProductOptionRouter)
    private productOptionRouter: ProductOptionRouter,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRouter)
    private productVariantRouter: ProductVariantRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(
      "/:productId/option",
      zodValidate(ProductChildParamsSchema, "params"),
      permissionMiddleware("product", "update"),
      this.productController.checkExits("productId"),
      this.productOptionRouter.getRouter(),
    );

    this.router.use(
      "/:productId/variant-unit",
      zodValidate(ProductChildParamsSchema, "params"),
      permissionMiddleware("product", "update"),
      this.productController.checkExits("productId"),
      this.productVariantRouter.getRouter(),
    );

    this.router.get(
      "/barcode/:barcode",
      zodValidate(GetByBarcodeSchema, "params"),
      // permissionMiddleware("product", "read"),
      this.productController.getProductVariantByBarcode,
    );

    this.router.delete(
      "/many",
      zodValidate(ProductDeleteManyQuery, "query"),
      permissionMiddleware("product", "delete"),
      this.productController.deleteMany,
    );

    this.router.get(
      "/",
      zodValidate(ProductQuerySchema, "query"),
      permissionMiddleware("product", "read"),
      this.productController.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateProductSchema, "body"),
      permissionMiddleware("product", "create"),
      this.productController.create,
    );

    this.router.get(
      "/:id",
      zodValidate(ProductParamsSchema, "params"),
      permissionMiddleware("product", "read"),
      this.productController.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(ProductParamsSchema, "params"),
      zodValidate(UpdateProductSchema, "body"),
      permissionMiddleware("product", "update"),
      this.productController.update,
    );

    // DELETE /product/:id - Delete product
    this.router.delete(
      "/:id",
      zodValidate(ProductParamsSchema, "params"),
      permissionMiddleware("product", "delete"),
      this.productController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
