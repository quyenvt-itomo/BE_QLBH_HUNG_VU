import { Router } from "express";
import { injectable, inject } from "inversify";
import { VatDebtAdjustmentController } from "./vatDebtAdjustment.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateVatDebtAdjustmentSchema,
  UpdateVatDebtAdjustmentSchema,
  VatDebtAdjustmentQuerySchema,
  VatDebtAdjustmentParamsSchema,
} from "./vatDebtAdjustment.validator";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "./vatDebtAdjustment.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class VatDebtAdjustmentRouter {
  private router: Router;

  constructor(
    @inject(VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentController)
    private controller: VatDebtAdjustmentController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(VatDebtAdjustmentQuerySchema, "query"),
      permissionMiddleware("vatDebtAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateVatDebtAdjustmentSchema, "body"),
      permissionMiddleware("vatDebtAdjustment", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(VatDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("vatDebtAdjustment", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(VatDebtAdjustmentParamsSchema, "params"),
      zodValidate(UpdateVatDebtAdjustmentSchema, "body"),
      permissionMiddleware("vatDebtAdjustment", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(VatDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("vatDebtAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
