import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { FundTransactionController } from "./fundTransaction.controller";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
@injectable()
export class FundTransactionRouter { private router = Router(); constructor(@inject(FUND_TRANSACTION_TYPES.Controller) controller: FundTransactionController) { this.router.get("/", permissionMiddleware("fundReport", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("fundReport", "read"), controller.getById); } getRouter() { return this.router; } }
