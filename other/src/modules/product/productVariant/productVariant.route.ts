import { Router } from "express";
import { injectable, inject } from "inversify";
import { ProductVariantController } from "./productVariant.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  ProductVariantParamsSchema,
  UpdateProductVariantSchema,
} from "./productVariant.validator";
import { PRODUCT_VARIANT_TYPES } from "./productVariant.types";

@injectable()
export class ProductVariantRouter {
  private router: Router;

  constructor(
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantController)
    private controller: ProductVariantController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.put(
      "/:id",
      zodValidate(ProductVariantParamsSchema, "params"),
      zodValidate(UpdateProductVariantSchema, "body"),
      this.controller.update,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
