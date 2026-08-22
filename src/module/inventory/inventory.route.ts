import { Router } from "express";
import { inject, injectable } from "inversify";
import { InventoryController } from "./inventory.controller";
import { INVENTORY_TYPES } from "./inventory.types";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  GetStockReportQuerySchema,
  GetTransactionDetailsQuerySchema,
} from "./inventory.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

/**
 * Inventory Router
 */
@injectable()
export class InventoryRouter {
  public router: Router;

  constructor(
    @inject(INVENTORY_TYPES.InventoryController)
    private controller: InventoryController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /inventory/stock-report - Báo cáo tồn kho
    // Query params: startDate, endDate, storeIds (comma-separated), productIds (comma-separated)
    this.router.get(
      "/report",
      zodValidate(GetStockReportQuerySchema, "query"),
      permissionMiddleware("inventoryReport", "read"),
      this.controller.getStockReport,
    );

    // GET /inventory/transactions - Chi tiết transactions
    // Query params: startDate, endDate, storeIds, productIds, productIdIds
    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      permissionMiddleware("inventoryReport", "read"),
      this.controller.getTransactionDetails,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
