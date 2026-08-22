import { Router } from "express";
import { injectable, inject } from "inversify";
import { InventoryConversionLineController } from "./inventoryConversionLine.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateInventoryConversionLineSchema,
  UpdateInventoryConversionLineSchema,
  InventoryConversionLineQuerySchema,
  InventoryConversionLineParamsSchema,
  RejectInventoryConversionLineSchema,
} from "./inventoryConversionLine.validator";
import { INVENTORY_CONVERSION_LINE_TYPES } from "./inventoryConversionLine.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class InventoryConversionLineRouter {
  private router: Router;

  constructor(
    @inject(INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineController)
    private controller: InventoryConversionLineController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(InventoryConversionLineQuerySchema, "query"),
      permissionMiddleware("inventoryConversion", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateInventoryConversionLineSchema, "body"),
      permissionMiddleware("inventoryConversion", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(InventoryConversionLineParamsSchema, "params"),
      permissionMiddleware("inventoryConversion", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(InventoryConversionLineParamsSchema, "params"),
      zodValidate(UpdateInventoryConversionLineSchema, "body"),
      permissionMiddleware("inventoryConversion", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(InventoryConversionLineParamsSchema, "params"),
      permissionMiddleware("inventoryConversion", "delete"),
      this.controller.delete,
    );

    this.router.post(
      "/:id/approve",
      zodValidate(InventoryConversionLineParamsSchema, "params"),
      permissionMiddleware("inventoryConversion", "approve"),
      this.controller.approve,
    );

    this.router.post(
      "/:id/reject",
      zodValidate(InventoryConversionLineParamsSchema, "params"),
      zodValidate(RejectInventoryConversionLineSchema, "body"),
      permissionMiddleware("inventoryConversion", "approve"),
      this.controller.reject,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
