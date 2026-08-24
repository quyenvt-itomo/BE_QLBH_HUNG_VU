import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { FundController } from "./fund.controller";
import { FUND_TYPES } from "./fund.types";
import { CreateFundSchema, FundQuerySchema, UpdateFundSchema } from "./fund.validator";
@injectable()
export class FundRouter {
  private router = Router();
  constructor(@inject(FUND_TYPES.Controller) controller: FundController) {
    this.router.get("/", zodValidate(FundQuerySchema, "query"), permissionMiddleware("fund", "read"), controller.getAllWithPagination);
    this.router.get("/:id", permissionMiddleware("fund", "read"), controller.getById);
    this.router.post("/", zodValidate(CreateFundSchema, "body"), permissionMiddleware("fund", "create"), controller.create);
    this.router.put("/:id", zodValidate(UpdateFundSchema, "body"), permissionMiddleware("fund", "update"), controller.update);
    this.router.patch("/:id", zodValidate(UpdateFundSchema, "body"), permissionMiddleware("fund", "update"), controller.update);
    this.router.delete("/bulk", permissionMiddleware("fund", "delete"), controller.deleteMany);
    this.router.delete("/:id", permissionMiddleware("fund", "delete"), controller.delete);
  }
  getRouter() { return this.router; }
}
