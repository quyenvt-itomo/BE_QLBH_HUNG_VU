import { Router } from "express";
import { inject, injectable } from "inversify";
import { LoyaltyPointController } from "./loyaltyPoint.controller";
import { LOYALTY_POINT_TYPES } from "./loyaltyPoint.types";
import {
  GetPartnerPointsReportQuerySchema,
  GetTransactionDetailsQuerySchema,
  RecalculateFromDateSchema,
} from "./loyaltyPoint.validator";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

/**
 * LoyaltyPoint Router
 */
@injectable()
export class LoyaltyPointRouter {
  public router: Router;

  constructor(
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointController)
    private controller: LoyaltyPointController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /loyalty-point/report - Báo cáo tích điểm theo partner
    this.router.get(
      "/report",
      zodValidate(GetPartnerPointsReportQuerySchema, "query"),
      permissionMiddleware("loyaltyPointReport", "read"),
      this.controller.getPartnerPointsReport,
    );

    // GET /loyalty-point/transaction - Chi tiết giao dịch tích điểm
    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      permissionMiddleware("loyaltyPointReport", "read"),
      this.controller.getTransactionDetails,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
