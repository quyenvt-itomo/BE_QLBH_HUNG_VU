import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { DebtController } from "./debt.controller";
import { DEBT_TYPES } from "./debt.types";
import {
  DebtBalanceParamsSchema,
  GetPartnerDebtReportQuerySchema,
  GetTransactionDetailsQuerySchema,
} from "./debt.validator";

/** Router cho các endpoint báo cáo công nợ. */
@injectable()
export class DebtRouter {
  private router = Router();

  constructor(
    @inject(DEBT_TYPES.DebtController)
    controller: DebtController,
  ) {
    this.router.get(
      "/report",
      zodValidate(GetPartnerDebtReportQuerySchema, "query"),
      permissionMiddleware("debtReport", "read"),
      controller.getPartnerDebtReport,
    );
    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      permissionMiddleware("debtReport", "read"),
      controller.getTransactionDetails,
    );
    this.router.get(
      "/balance/:partnerId",
      zodValidate(DebtBalanceParamsSchema, "params"),
      permissionMiddleware("debtReport", "read"),
      controller.getBalance,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
