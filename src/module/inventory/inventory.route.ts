import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { InventoryController } from "./inventory.controller";
import { INVENTORY_TYPES } from "./inventory.types";
import {
  GetStockReportQuerySchema,
  GetTransactionDetailsQuerySchema,
} from "./inventory.validator";

@injectable()
export class InventoryRouter {
  private router = Router();

  constructor(
    @inject(INVENTORY_TYPES.InventoryController)
    private controller: InventoryController,
  ) {
    this.router.get(
      "/",
      zodValidate(GetStockReportQuerySchema, "query"),
      permissionMiddleware("inventoryReport", "read"),
      asyncHandler(this.controller.getStockReport),
    );
    this.router.get(
      "/report",
      zodValidate(GetStockReportQuerySchema, "query"),
      permissionMiddleware("inventoryReport", "read"),
      asyncHandler(this.controller.getStockReport),
    );
    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      permissionMiddleware("inventoryReport", "read"),
      asyncHandler(this.controller.getTransactionDetails),
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
