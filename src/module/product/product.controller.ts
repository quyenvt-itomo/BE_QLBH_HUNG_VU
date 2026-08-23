import { injectable, inject } from "inversify";
import { ProductService } from "./product.service";
import { PRODUCT_TYPES } from "./product.types";
import { BaseController } from "@/shared/base/BaseController";
import { Product } from "@/database/models/Product";
import { Request, Response, NextFunction } from "express";
import { ProductQueryDto } from "./product.validator";

@injectable()
export class ProductController extends BaseController<Product> {
  protected service: ProductService;

  constructor(@inject(PRODUCT_TYPES.ProductService) service: ProductService) {
    super();
    this.service = service;
  }

  getPublicProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as ProductQueryDto;
      options.isPublic = true;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findAllWithPagination(
        options,
        undefined,
        reqContext,
      );
      if (data.data?.length)
        await this.service.hydrateEntities(data.data, reqContext);
      return res.status(data.statusCode).json(data);
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  getPriceHistories = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const query = req.query as unknown as ProductQueryDto;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.getPriceHistories(query, reqContext);
      return res.status(200).json({
        success: true,
        data,
        statusCode: 200,
        message: "OK",
      });
    } catch (error) {
      next(error);
    }
  };
}
