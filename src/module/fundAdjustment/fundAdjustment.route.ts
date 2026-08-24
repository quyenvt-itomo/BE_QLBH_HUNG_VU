import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { FundAdjustmentController } from "./fundAdjustment.controller";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { CreateFundAdjustmentSchema, FundAdjustmentQuerySchema, UpdateFundAdjustmentSchema } from "./fundAdjustment.validator";
@injectable()
export class FundAdjustmentRouter {
  private router = Router();
  constructor(@inject(FUND_ADJUSTMENT_TYPES.Controller) controller: FundAdjustmentController) {
    this.router.get("/", zodValidate(FundAdjustmentQuerySchema, "query"), permissionMiddleware("fundAdjustment", "read"), controller.getAllWithPagination);
    this.router.get("/:id", permissionMiddleware("fundAdjustment", "read"), controller.getById);
    this.router.post("/", zodValidate(CreateFundAdjustmentSchema, "body"), permissionMiddleware("fundAdjustment", "create"), controller.create);
    this.router.put("/:id", zodValidate(UpdateFundAdjustmentSchema, "body"), permissionMiddleware("fundAdjustment", "update"), controller.update);
    this.router.patch("/:id", zodValidate(UpdateFundAdjustmentSchema, "body"), permissionMiddleware("fundAdjustment", "update"), controller.update);
    this.router.delete("/bulk", permissionMiddleware("fundAdjustment", "delete"), controller.deleteMany);
    this.router.delete("/:id", permissionMiddleware("fundAdjustment", "delete"), controller.delete);
  }
  getRouter() { return this.router; }
}
