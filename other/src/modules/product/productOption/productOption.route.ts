import { Router } from "express";
import { injectable, inject } from "inversify";
import { ProductOptionController } from "./productOption.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateManyProductOptionSchema,
  CreateProductOptionSchema,
  DeleteProductOptionByTypeIdSchema,
  ProductOptionParamsSchema,
} from "./productOption.validator";
import { PRODUCT_OPTION_TYPES } from "./productOption.types";

@injectable()
export class ProductOptionRouter {
  private router: Router;

  constructor(
    @inject(PRODUCT_OPTION_TYPES.ProductOptionController)
    private productOptionController: ProductOptionController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/type",
      zodValidate(CreateManyProductOptionSchema, "body"),
      this.productOptionController.createMany,
    );

    this.router.post(
      "/",
      zodValidate(CreateProductOptionSchema, "body"),
      this.productOptionController.create,
    );

    this.router.delete(
      "/:id",
      zodValidate(ProductOptionParamsSchema, "params"),
      this.productOptionController.delete,
    );

    this.router.delete(
      "/type/:typeId",
      zodValidate(DeleteProductOptionByTypeIdSchema, "params"),
      this.productOptionController.deleteByTypeId,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
