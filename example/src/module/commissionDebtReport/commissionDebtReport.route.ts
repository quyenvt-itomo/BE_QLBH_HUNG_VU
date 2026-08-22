import { Router } from "express";
import { inject, injectable } from "inversify";
import { COMMISSION_DEBT_REPORT_TYPES } from "./commissionDebtReport.types";
import { CommissionDebtReportController } from "./commissionDebtReport.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CommissionDebtReportQuerySchema,
  CommissionDebtDetailQuerySchema,
} from "./commissionDebtReport.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class CommissionDebtReportRouter {
  private router: Router;

  constructor(
    @inject(COMMISSION_DEBT_REPORT_TYPES.CommissionDebtReportController)
    private controller: CommissionDebtReportController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/report",
      zodValidate(CommissionDebtReportQuerySchema, "query"),
      permissionMiddleware("commissionDebtReport", "read"),
      this.controller.getReport,
    );

    this.router.get(
      "/detail",
      zodValidate(CommissionDebtDetailQuerySchema, "query"),
      permissionMiddleware("commissionDebtReport", "read"),
      this.controller.getDetail,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
