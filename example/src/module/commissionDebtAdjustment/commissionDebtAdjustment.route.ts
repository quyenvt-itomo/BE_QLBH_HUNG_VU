import { Router } from "express";
import { injectable, inject } from "inversify";
import { CommissionDebtAdjustmentController } from "./commissionDebtAdjustment.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateCommissionDebtAdjustmentSchema,
  UpdateCommissionDebtAdjustmentSchema,
  CommissionDebtAdjustmentQuerySchema,
  CommissionDebtAdjustmentParamsSchema,
} from "./commissionDebtAdjustment.validator";
import { COMMISSION_DEBT_ADJUSTMENT_TYPES } from "./commissionDebtAdjustment.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class CommissionDebtAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(COMMISSION_DEBT_ADJUSTMENT_TYPES.CommissionDebtAdjustmentController)
    private controller: CommissionDebtAdjustmentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(CommissionDebtAdjustmentQuerySchema, "query"),
      permissionMiddleware("commissionDebtAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateCommissionDebtAdjustmentSchema, "body"),
      permissionMiddleware("commissionDebtAdjustment", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(CommissionDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("commissionDebtAdjustment", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(CommissionDebtAdjustmentParamsSchema, "params"),
      zodValidate(UpdateCommissionDebtAdjustmentSchema, "body"),
      permissionMiddleware("commissionDebtAdjustment", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(CommissionDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("commissionDebtAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
