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
    // GET /vat-debt/adjustment - Get all vat with filters
    this.router.get(
      "/",
      zodValidate(VatDebtAdjustmentQuerySchema, "query"),
      permissionMiddleware("vatAdjustment", "read"),
      this.controller.getAllWithPagination,
    );

    // POST /vat-debt/adjustment - Create new vat
    this.router.post(
      "/",
      zodValidate(CreateVatDebtAdjustmentSchema, "body"),
      permissionMiddleware("vatAdjustment", "create"),
      this.controller.create,
    );

    // GET /vat-debt/adjustment/:id - Get vat by ID
    this.router.get(
      "/:id",
      zodValidate(VatDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("vatAdjustment", "read"),
      this.controller.getById,
    );

    // PUT /vat-debt/adjustment/:id - Update vat
    this.router.put(
      "/:id",
      zodValidate(VatDebtAdjustmentParamsSchema, "params"),
      zodValidate(UpdateVatDebtAdjustmentSchema, "body"),
      permissionMiddleware("vatAdjustment", "update"),
      this.controller.update,
    );

    // DELETE /vat-debt/adjustment/:id - Delete vat
    this.router.delete(
      "/:id",
      zodValidate(VatDebtAdjustmentParamsSchema, "params"),
      permissionMiddleware("vatAdjustment", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
