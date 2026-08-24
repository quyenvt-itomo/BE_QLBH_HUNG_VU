import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { VatAdjustmentController } from "./vatAdjustment.controller";
import { VAT_ADJUSTMENT_TYPES } from "./vatAdjustment.types";
@injectable()
export class VatAdjustmentRouter { private router = Router(); constructor(@inject(VAT_ADJUSTMENT_TYPES.Controller) controller: VatAdjustmentController) { this.router.get("/", permissionMiddleware("vatAdjustment", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("vatAdjustment", "read"), controller.getById); this.router.post("/", permissionMiddleware("vatAdjustment", "create"), controller.create); this.router.put("/:id", permissionMiddleware("vatAdjustment", "update"), controller.update); this.router.delete("/:id", permissionMiddleware("vatAdjustment", "delete"), controller.delete); } getRouter() { return this.router; } }
