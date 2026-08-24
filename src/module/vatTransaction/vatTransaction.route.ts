import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { VatTransactionController } from "./vatTransaction.controller";
import { VAT_TRANSACTION_TYPES } from "./vatTransaction.types";
@injectable()
export class VatTransactionRouter { private router = Router(); constructor(@inject(VAT_TRANSACTION_TYPES.Controller) controller: VatTransactionController) { this.router.get("/", permissionMiddleware("vatReport", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("vatReport", "read"), controller.getById); } getRouter() { return this.router; } }
