import { Router } from "express";
import { inject, injectable } from "inversify";
import { VAT_DEBT_REPORT_TYPES } from "./vatDebtReport.types";
import { VatDebtReportController } from "./vatDebtReport.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  VatDebtReportQuerySchema,
  VatDebtDetailQuerySchema,
} from "./vatDebtReport.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class VatDebtReportRouter {
  private router: Router;

  constructor(
    @inject(VAT_DEBT_REPORT_TYPES.VatDebtReportController)
    private controller: VatDebtReportController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/report",
      zodValidate(VatDebtReportQuerySchema, "query"),
      permissionMiddleware("vatDebtReport", "read"),
      this.controller.getReport,
    );

    this.router.get(
      "/detail",
      zodValidate(VatDebtDetailQuerySchema, "query"),
      permissionMiddleware("vatDebtReport", "read"),
      this.controller.getDetail,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
