import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { DebtTransactionController } from "./debtTransaction.controller";
import { DEBT_TRANSACTION_TYPES } from "./debtTransaction.types";
import { DebtTransactionQuerySchema } from "./debtTransaction.validator";

@injectable()
export class DebtTransactionRouter {
  private router = Router();

  constructor(
    @inject(DEBT_TRANSACTION_TYPES.Controller)
    controller: DebtTransactionController,
  ) {
    this.router.get(
      "/",
      zodValidate(DebtTransactionQuerySchema, "query"),
      permissionMiddleware("debtReport", "read"),
      controller.getAllWithPagination,
    );
    this.router.get(
      "/:id",
      permissionMiddleware("debtReport", "read"),
      controller.getById,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
