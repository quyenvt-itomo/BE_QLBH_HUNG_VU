import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { FundTransferController } from "./fundTransfer.controller";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
@injectable()
export class FundTransferRouter { private router = Router(); constructor(@inject(FUND_TRANSFER_TYPES.Controller) controller: FundTransferController) { this.router.get("/", permissionMiddleware("fundTransfer", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("fundTransfer", "read"), controller.getById); this.router.post("/", permissionMiddleware("fundTransfer", "create"), controller.create); this.router.put("/:id", permissionMiddleware("fundTransfer", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("fundTransfer", "delete"), controller.delete); } getRouter() { return this.router; } }
