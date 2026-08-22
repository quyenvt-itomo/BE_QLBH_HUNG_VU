import { Router } from "express";
import { inject, injectable } from "inversify";
import { InventoryController } from "./inventory.controller";
import { INVENTORY_TYPES } from "./inventory.types";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  GetStockReportQuerySchema,
  GetTransactionDetailsQuerySchema,
} from "./inventory.validator";

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
      "/stock-report",
      zodValidate(GetStockReportQuerySchema, "query"),
      this.controller.getStockReport,
    );

    // GET /inventory/transactions - Chi tiết transactions
    // Query params: startDate, endDate, storeIds, productIds, productVariantIds
    this.router.get(
      "/transaction",
      zodValidate(GetTransactionDetailsQuerySchema, "query"),
      this.controller.getTransactionDetails,
    );

    this.router.get(
      "/recalculate/queue-stats",
      this.controller.getRecalculateQueueStats,
    );

    this.router.get(
      "/recalculate/stream",
      this.controller.streamRecalculateQueueStats,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
