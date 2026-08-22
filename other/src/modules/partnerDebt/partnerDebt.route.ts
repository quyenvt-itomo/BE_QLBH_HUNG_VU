import { Router } from "express";
import { inject, injectable } from "inversify";
import { PartnerDebtController } from "./partnerDebt.controller";
import { PARTNER_DEBT_TYPES } from "./partnerDebt.types";
import {
  GetPartnerDebtReportQuerySchema,
  GetTransactionDetailsQuerySchema,
} from "./partnerDebt.validator";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import {
  PARTNER_DEBT_ADJUSTMENT_TYPES,
  PartnerDebtAdjustmentRouter,
} from "../partnerDebtAdjustment";
import {
  PARTNER_DEBT_OFFSET_TYPES,
  PartnerDebtOffsetRouter,
} from "../partnerDebtOffset";

/**
 * PartnerDebt Router
 */
@injectable()
export class PartnerDebtRouter {
  public router: Router;

  constructor(
    @inject(PARTNER_DEBT_TYPES.PartnerDebtController)
    private controller: PartnerDebtController,
    @inject(PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRouter)
    private partnerDebtAdjustmentRouter: PartnerDebtAdjustmentRouter,
    @inject(PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRouter)
    private partnerDebtOffsetRouter: PartnerDebtOffsetRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(
      "/adjustment",
      this.partnerDebtAdjustmentRouter.getRouter(),
    );

    this.router.use("/offset", this.partnerDebtOffsetRouter.getRouter());

    // GET /partner-debt/report - Báo cáo công nợ đối tác
    // Query params: startDate, endDate, side, partnerIds
    this.router.get(
      "/report",
      zodValidate(GetPartnerDebtReportQuerySchema, "query"),
      permissionMiddleware("debtReport", "read"),
      this.controller.getPartnerDebtReport,
    );

    // GET /partner-debt/transaction - Chi tiết transactions
    // Query params: startDate, endDate, side, partnerId
    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      permissionMiddleware("debtReport", "read"),
      this.controller.getTransactionDetails,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
