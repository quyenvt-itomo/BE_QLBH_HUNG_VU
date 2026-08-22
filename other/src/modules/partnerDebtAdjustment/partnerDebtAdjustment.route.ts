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
    // GET /partner-debt/adjustment - Get all partner with filters
    this.router.get(
      "/",
      zodValidate(PartnerDebtAdjustmentQuerySchema, "query"),
      permissionMiddleware("debtAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    // POST /partner-debt/adjustment - Create new partner
    this.router.post(
      "/",
      zodValidate(CreatePartnerDebtAdjustmentSchema, "body"),
      permissionMiddleware("debtAdjustment", "create"),
      this.controller.create,
    );

    // GET /partner-debt/adjustment/:id - Get partner by ID
    this.router.get(
      "/:id",
      zodValidate(PartnerDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("debtAdjustment", "read"),
      this.controller.getById,
    );

    // PUT /partner-debt/adjustment/:id - Update partner
    this.router.put(
      "/:id",
      zodValidate(PartnerDebtAdjustmentParamsSchema, "params"),
      zodValidate(UpdatePartnerDebtAdjustmentSchema, "body"),
      permissionMiddleware("debtAdjustment", "update"),
      this.controller.update,
    );

    // DELETE /partner-debt/adjustment/:id - Delete partner
    this.router.delete(
      "/:id",
      zodValidate(PartnerDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("debtAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
