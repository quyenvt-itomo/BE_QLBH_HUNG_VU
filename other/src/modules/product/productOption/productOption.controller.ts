import { injectable, inject } from "inversify";
import { ProductOptionService } from "./productOption.service";
import { PRODUCT_OPTION_TYPES } from "./productOption.types";
import { BaseController } from "@/shared/base/BaseController";
import { ProductOption } from "@/database/models/ProductOption";
import { Request, Response, NextFunction } from "express";
import { DeleteProductOptionByTypeIdDto } from "./productOption.validator";
import { asyncHandler } from "@/shared/utils/controller.utils";
import logger from "@/shared/utils/logger";
import { ProductChildParamsDto } from "../product.validator";

/**
 * ProductOption Controller - Tenant Entity
 */
@injectable()
export class ProductOptionController extends BaseController<ProductOption> {
  protected service: ProductOptionService;

  constructor(
    @inject(PRODUCT_OPTION_TYPES.ProductOptionService)
    productOptionService: ProductOptionService,
  ) {
    super();
    this.service = productOptionService;
  }

  createMany = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { productId } = req.params as ProductChildParamsDto;
        const data = req.body;
        await this.service.createMany(productId, data, req);
        this.sendResponse({
          res,
          message: "Product options created successfully",
        });
      } catch (error: any) {
        logger.error("Error ProductOptionController:[createMany]:", error);
        this.sendError({
          res,
          message:
            error instanceof Error ? error.message : "Internal server error",
          errors: error.errors || [],
        });
      }
    },
  );

  deleteByTypeId = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { productId, typeId } =
          req.params as DeleteProductOptionByTypeIdDto;

        await this.service.deleteByTypeId(productId, typeId);

        this.sendResponse({
          res,
          message: "Product options deleted successfully",
        });
      } catch (error: any) {
        logger.error("Error ProductOptionController:[deleteByTypeId]:", error);
        this.sendError({
          res,
          message:
            error instanceof Error ? error.message : "Internal server error",
          errors: error.errors || [],
        });
      }
    },
  );
}
