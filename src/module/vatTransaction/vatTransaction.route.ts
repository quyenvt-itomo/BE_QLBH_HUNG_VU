import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { VatTransactionController } from "./vatTransaction.controller";
import { VAT_TRANSACTION_TYPES } from "./vatTransaction.types";
import { VatBalanceQuerySchema, VatTransactionQuerySchema } from "./vatTransaction.validator";
@injectable()
export class VatTransactionRouter {
  private router = Router();

  constructor(
    @inject(VAT_TRANSACTION_TYPES.Controller)
    controller: VatTransactionController,
  ) {
    this.router.get(
      "/",
      zodValidate(VatTransactionQuerySchema, "query"),
      permissionMiddleware("vatReport", "read"),
      controller.getAllWithPagination,
    );
    this.router.get(
      "/balance",
      zodValidate(VatBalanceQuerySchema, "query"),
      permissionMiddleware("vatAdjustment", "read"),
      controller.getBalance,
    );
    this.router.get(
      "/:id",
      permissionMiddleware("vatReport", "read"),
      controller.getById,
    );
  }

  getRouter() {
    return this.router;
  }
}
