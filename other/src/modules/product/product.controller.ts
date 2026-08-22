import { injectable, inject } from "inversify";
import { ProductService } from "./product.service";
import { PRODUCT_TYPES } from "./product.types";
import { BaseController } from "@/shared/base/BaseController";
import { Product } from "@/database/models/Product";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { Request, Response, NextFunction } from "express";
import logger from "@/shared/utils/logger";
import {
  GetByBarcodeDto,
  ProductDeleteManyQueryDto,
} from "./product.validator";

/**
 * Product Controller - Tenant Entity
 */
@injectable()
export class ProductController extends BaseController<Product> {
  protected service: ProductService;

  constructor(@inject(PRODUCT_TYPES.ProductService) service: ProductService) {
    super();
    this.service = service;
  }

  getProductVariantByBarcode = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { barcode } = req.params as GetByBarcodeDto;
        const variant = await this.service.getProductVariantByBarcode(
          barcode,
          req,
        );
        this.sendResponse({
          res,
          data: variant,
        });
      } catch (error) {
        logger.error(
          "Error ProductController:[getProductVariantByBarcode]:",
          error,
        );
        this.sendError({
          res,
          message: "Failed to get product variant by barcode",
          statusCode: 500,
          errors: (error as any).errors || [],
        });
      }
    },
  );

  deleteMany = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ids = [] } = req.query as ProductDeleteManyQueryDto;
        await this.service.deleteMany(ids);
        this.sendResponse({
          res,
          message: "Products deleted successfully",
        });
      } catch (error) {
        logger.error("Error ProductController:[deleteMany]:", error);
        this.sendError({
          res,
          message: "Failed to delete products",
          statusCode: 500,
          errors: (error as any).errors || [],
        });
      }
    },
  );
}
