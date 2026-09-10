import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { VatAdjustmentController } from "./vatAdjustment.controller";
import { VAT_ADJUSTMENT_TYPES } from "./vatAdjustment.types";
import {
  CreateVatAdjustmentSchema,
  UpdateVatAdjustmentSchema,
  VatAdjustmentDeleteManySchema,
  VatAdjustmentParamsSchema,
  VatAdjustmentQuerySchema,
} from "./vatAdjustment.validator";

@injectable()
export class VatAdjustmentRouter {
  private router = Router();

  constructor(
    @inject(VAT_ADJUSTMENT_TYPES.Controller)
    controller: VatAdjustmentController,
  ) {
    this.router.get(
      "/",
      zodValidate(VatAdjustmentQuerySchema, "query"),
      permissionMiddleware("vatAdjustment", "read"),
      controller.getAllWithPagination,
    );
    this.router.get(
      "/:id",
      zodValidate(VatAdjustmentParamsSchema, "params"),
      permissionMiddleware("vatAdjustment", "read"),
      controller.getById,
    );
    this.router.post(
      "/",
      zodValidate(CreateVatAdjustmentSchema, "body"),
      permissionMiddleware("vatAdjustment", "create"),
      controller.create,
    );
    this.router.put(
      "/:id",
      zodValidate(VatAdjustmentParamsSchema, "params"),
      zodValidate(UpdateVatAdjustmentSchema, "body"),
      permissionMiddleware("vatAdjustment", "update"),
      controller.update,
    );
    this.router.patch(
      "/:id",
      zodValidate(VatAdjustmentParamsSchema, "params"),
      zodValidate(UpdateVatAdjustmentSchema, "body"),
      permissionMiddleware("vatAdjustment", "update"),
      controller.update,
    );
    this.router.delete(
      "/bulk",
      zodValidate(VatAdjustmentDeleteManySchema, "body"),
      permissionMiddleware("vatAdjustment", "delete"),
      controller.deleteMany,
    );
    this.router.delete(
      "/:id",
      zodValidate(VatAdjustmentParamsSchema, "params"),
      permissionMiddleware("vatAdjustment", "delete"),
      controller.delete,
    );
  }

  getRouter() {
    return this.router;
  }
}
