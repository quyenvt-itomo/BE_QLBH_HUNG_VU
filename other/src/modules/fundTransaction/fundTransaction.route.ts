import { Router } from "express";
import { injectable, inject } from "inversify";
import { FundTransactionController } from "./fundTransaction.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  GetFundTransactionReportQuerySchema,
  GetTransactionDetailsQuerySchema,
} from "./fundTransaction.validator";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { FUND_ADJUSTMENT_TYPES, FundAdjustmentRouter } from "../fundAdjustment";
import { FUND_TRANSFER_TYPES, FundTransferRouter } from "../fundTransfer";

@injectable()
export class FundTransactionRouter {
  private router: Router;

  constructor(
    @inject(FUND_TRANSACTION_TYPES.FundTransactionController)
    private controller: FundTransactionController,
    @inject(FUND_ADJUSTMENT_TYPES.FundAdjustmentRouter)
    private fundAdjustmentRouter: FundAdjustmentRouter,
    @inject(FUND_TRANSFER_TYPES.FundTransferRouter)
    private fundTransferRouter: FundTransferRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use("/adjustment", this.fundAdjustmentRouter.getRouter());

    this.router.use("/transfer", this.fundTransferRouter.getRouter());

    this.router.get(
      "/report",
      zodValidate(GetFundTransactionReportQuerySchema, "query"),
      permissionMiddleware("fundReport", "read"),
      this.controller.getReport,
    );

    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      permissionMiddleware("fundReport", "read"),
      this.controller.getTransactionDetails,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
