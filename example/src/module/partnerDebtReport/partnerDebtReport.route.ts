import { Router } from "express";
import { inject, injectable } from "inversify";
import { PARTNER_DEBT_REPORT_TYPES } from "./partnerDebtReport.types";
import { PartnerDebtReportController } from "./partnerDebtReport.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  PartnerDebtReportQuerySchema,
  PartnerDebtDetailQuerySchema,
  PartnerDebtListQuerySchema,
  PartnerDebtInvoiceListQuerySchema,
} from "./partnerDebtReport.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PartnerDebtReportRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_DEBT_REPORT_TYPES.PartnerDebtReportController)
    private controller: PartnerDebtReportController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/report",
      zodValidate(PartnerDebtReportQuerySchema, "query"),
      permissionMiddleware("partnerDebtReport", "read"),
      this.controller.getReport,
    );

    this.router.get(
      "/transaction",
      zodValidate(PartnerDebtDetailQuerySchema, "query"),
      permissionMiddleware("partnerDebtReport", "read"),
      this.controller.getDetail,
    );

    this.router.get(
      "/partners",
      zodValidate(PartnerDebtListQuerySchema, "query"),
      permissionMiddleware("partnerDebtReport", "read"),
      this.controller.getPartnersWithDebt,
    );

    this.router.get(
      "/invoices",
      zodValidate(PartnerDebtInvoiceListQuerySchema, "query"),
      permissionMiddleware("partnerDebtReport", "read"),
      this.controller.getPartnerInvoices,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
