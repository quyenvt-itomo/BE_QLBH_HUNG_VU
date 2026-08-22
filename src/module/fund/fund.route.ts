import { Router } from "express";
import { injectable, inject } from "inversify";
import { FundController } from "./fund.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateFundSchema,
  UpdateFundSchema,
  FundQuerySchema,
  FundParamsSchema,
} from "./fund.validator";
import { FUND_TYPES } from "./fund.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class FundRouter {
  private router: Router;

  constructor(
    @inject(FUND_TYPES.FundController)
    private controller: FundController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(FundQuerySchema, "query"),
      permissionMiddleware("fund", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateFundSchema, "body"),
      permissionMiddleware("fund", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(FundParamsSchema, "params"),
      permissionMiddleware("fund", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(FundParamsSchema, "params"),
      zodValidate(UpdateFundSchema, "body"),
      permissionMiddleware("fund", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(FundParamsSchema, "params"),
      permissionMiddleware("fund", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
