import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { DebtAdjustmentController } from "./debtAdjustment.controller";
import { DEBT_ADJUSTMENT_TYPES } from "./debtAdjustment.types";
import { CreateDebtAdjustmentSchema, DebtAdjustmentQuerySchema, UpdateDebtAdjustmentSchema } from "./debtAdjustment.validator";
@injectable()
export class DebtAdjustmentRouter {
  private router = Router();
  constructor(@inject(DEBT_ADJUSTMENT_TYPES.Controller) controller: DebtAdjustmentController) {
    this.router.get("/", zodValidate(DebtAdjustmentQuerySchema, "query"), permissionMiddleware("debtAdjustment", "read"), controller.getAllWithPagination);
    this.router.get("/:id", permissionMiddleware("debtAdjustment", "read"), controller.getById);
    this.router.post("/", zodValidate(CreateDebtAdjustmentSchema, "body"), permissionMiddleware("debtAdjustment", "create"), controller.create);
    this.router.put("/:id", zodValidate(UpdateDebtAdjustmentSchema, "body"), permissionMiddleware("debtAdjustment", "update"), controller.update);
    this.router.patch("/:id", zodValidate(UpdateDebtAdjustmentSchema, "body"), permissionMiddleware("debtAdjustment", "update"), controller.update);
    this.router.delete("/bulk", permissionMiddleware("debtAdjustment", "delete"), controller.deleteMany);
    this.router.delete("/:id", permissionMiddleware("debtAdjustment", "delete"), controller.delete);
  }
  getRouter() { return this.router; }
}
