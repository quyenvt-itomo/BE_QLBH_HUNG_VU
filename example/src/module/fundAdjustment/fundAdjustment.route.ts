import { Router } from "express";
import { injectable, inject } from "inversify";
import { FundAdjustmentController } from "./fundAdjustment.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateFundAdjustmentSchema,
  UpdateFundAdjustmentSchema,
  FundAdjustmentQuerySchema,
  FundAdjustmentParamsSchema,
} from "./fundAdjustment.validator";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class FundAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(FUND_ADJUSTMENT_TYPES.FundAdjustmentController)
    private controller: FundAdjustmentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(FundAdjustmentQuerySchema, "query"),
      permissionMiddleware("fundAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateFundAdjustmentSchema, "body"),
      permissionMiddleware("fundAdjustment", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(FundAdjustmentParamsSchema, "params"),
      permissionMiddleware("fundAdjustment", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(FundAdjustmentParamsSchema, "params"),
      zodValidate(UpdateFundAdjustmentSchema, "body"),
      permissionMiddleware("fundAdjustment", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(FundAdjustmentParamsSchema, "params"),
      permissionMiddleware("fundAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
