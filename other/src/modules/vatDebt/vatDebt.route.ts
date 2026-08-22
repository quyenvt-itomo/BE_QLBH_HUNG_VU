import { Router } from "express";
import { inject, injectable } from "inversify";
import { VatDebtController } from "./vatDebt.controller";
import { VAT_DEBT_TYPES } from "./vatDebt.types";
import {
  GetVatDebtReportQuerySchema,
  GetVatDebtQuerySchema,
} from "./vatDebt.validator";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import {
  VAT_DEBT_ADJUSTMENT_TYPES,
  VatDebtAdjustmentRouter,
} from "../vatDebtAdjustment";

/**
 * VatDebt Router
 */
@injectable()
export class VatDebtRouter {
  public router: Router;

  constructor(
    @inject(VAT_DEBT_TYPES.VatDebtController)
    private controller: VatDebtController,
    @inject(VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRouter)
    private vatDebtAdjustmentRouter: VatDebtAdjustmentRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/adjustment", this.vatDebtAdjustmentRouter.getRouter());

    // GET /vat-debt/report - Báo cáo công nợ đối tác
    // Query params: startDate, endDate, side, vatIds
    this.router.get(
      "/report",
      zodValidate(GetVatDebtReportQuerySchema, "query"),
      permissionMiddleware("vatReport", "read"),
      this.controller.getVatDebtReport,
    );

    // GET /vat-debt - Lấy công nợ tại một thời điểm
    this.router.get(
      "/",
      zodValidate(GetVatDebtQuerySchema, "query"),
      permissionMiddleware("vatReport", "read"),
      this.controller.getDebtAtDate,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
