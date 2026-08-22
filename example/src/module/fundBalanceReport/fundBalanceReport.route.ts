import { Router } from "express";
import { inject, injectable } from "inversify";
import { FUND_BALANCE_REPORT_TYPES } from "./fundBalanceReport.types";
import { FundBalanceReportController } from "./fundBalanceReport.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  FundBalanceReportQuerySchema,
  FundBalanceDetailQuerySchema,
} from "./fundBalanceReport.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class FundBalanceReportRouter {
  private router: Router;

  constructor(
    @inject(FUND_BALANCE_REPORT_TYPES.FundBalanceReportController)
    private controller: FundBalanceReportController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/report",
      zodValidate(FundBalanceReportQuerySchema, "query"),
      permissionMiddleware("fundBalanceReport", "read"),
      this.controller.getReport,
    );

    this.router.get(
      "/detail",
      zodValidate(FundBalanceDetailQuerySchema, "query"),
      permissionMiddleware("fundBalanceReport", "read"),
      this.controller.getDetail,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
