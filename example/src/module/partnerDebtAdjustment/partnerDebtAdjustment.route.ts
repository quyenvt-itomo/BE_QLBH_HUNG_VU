import { Router } from "express";
import { injectable, inject } from "inversify";
import { PartnerDebtAdjustmentController } from "./partnerDebtAdjustment.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreatePartnerDebtAdjustmentSchema,
  UpdatePartnerDebtAdjustmentSchema,
  PartnerDebtAdjustmentQuerySchema,
  PartnerDebtAdjustmentParamsSchema,
} from "./partnerDebtAdjustment.validator";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "./partnerDebtAdjustment.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class PartnerDebtAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentController)
    private controller: PartnerDebtAdjustmentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PartnerDebtAdjustmentQuerySchema, "query"),
      permissionMiddleware("partnerDebtAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreatePartnerDebtAdjustmentSchema, "body"),
      permissionMiddleware("partnerDebtAdjustment", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(PartnerDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("partnerDebtAdjustment", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(PartnerDebtAdjustmentParamsSchema, "params"),
      zodValidate(UpdatePartnerDebtAdjustmentSchema, "body"),
      permissionMiddleware("partnerDebtAdjustment", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(PartnerDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("partnerDebtAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
