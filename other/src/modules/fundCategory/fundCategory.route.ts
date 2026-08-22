import { Router } from "express";
import { injectable, inject } from "inversify";
import { FundCategoryController } from "./fundCategory.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateFundCategorySchema,
  UpdateFundCategorySchema,
  FundCategoryQuerySchema,
  FundCategoryParamsSchema,
} from "./fundCategory.validator";
import { FUND_CATEGORY_TYPES } from "./fundCategory.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class FundCategoryRouter {
  private router: Router;

  constructor(
    @inject(FUND_CATEGORY_TYPES.FundCategoryController)
    private fundCategoryController: FundCategoryController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All fundCategory routes require authentication
    // this.router.use(authenticate);

    // GET /fundCategorys - Get all fundCategorys with filters
    this.router.get(
      "/",
      zodValidate(FundCategoryQuerySchema, "query"),
      permissionMiddleware("category", "read"),
      this.fundCategoryController.getAllWithPagination,
    );

    // POST /fundCategorys - Create new fundCategory
    this.router.post(
      "/",
      zodValidate(CreateFundCategorySchema, "body"),
      permissionMiddleware("category", "create"),
      this.fundCategoryController.create,
    );

    // GET /fundCategorys/:id - Get fundCategory by ID
    this.router.get(
      "/:id",
      zodValidate(FundCategoryParamsSchema, "params"),
      permissionMiddleware("category", "read"),
      this.fundCategoryController.getById,
    );

    // PUT /fundCategorys/:id - Update fundCategory
    this.router.put(
      "/:id",
      zodValidate(FundCategoryParamsSchema, "params"),
      zodValidate(UpdateFundCategorySchema, "body"),
      permissionMiddleware("category", "update"),
      this.fundCategoryController.update,
    );

    // DELETE /fundCategorys/:id - Delete fundCategory
    this.router.delete(
      "/:id",
      zodValidate(FundCategoryParamsSchema, "params"),
      permissionMiddleware("category", "delete"),
      this.fundCategoryController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
