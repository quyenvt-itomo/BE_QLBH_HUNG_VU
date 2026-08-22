import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { INVENTORY_TYPES } from "./inventory.types";
import { InventoryService } from "./inventory.service";
import {
  GetStockReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./inventory.validator";
import { BadRequestError } from "@/shared/types/errors";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";

/**
 * Inventory Controller
 * Xử lý các request liên quan đến báo cáo tồn kho
 */
@injectable()
export class InventoryController {
  constructor(
    @inject(INVENTORY_TYPES.InventoryService)
    private inventoryService: InventoryService,
  ) {}

  /**
   * GET /api/client/inventory/stock-report
   * Báo cáo tồn kho theo product (có thể expand ra variants)
   */
  getStockReport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery = req.query as unknown as GetStockReportQueryDto;

      const result = await this.inventoryService.getStockReport(validatedQuery);

      res.json({
        statusCode: 200,
        success: true,
        data: result.data,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return next(
          new BadRequestError("Invalid query parameters", error.errors),
        );
      }
      next(error);
    }
  };

  /**
   * GET /api/client/inventory/transactions
   * Chi tiết transactions (tổng hợp nhập xuất)
   */
  getTransactionDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery =
        req.query as unknown as GetTransactionDetailsQueryDto;

      const result =
        await this.inventoryService.getTransactionDetails(validatedQuery);

      res.json({
        success: true,
        data: result.data,
        summary: result.summary,
        pagination: result.pagination,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return next(
          new BadRequestError("Invalid query parameters", error.errors),
        );
      }
      next(error);
    }
  };

  getRecalculateQueueStats = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    res.json({
      success: true,
      data: InventoryRecalculateQueue.getLiveStats(),
    });
  };

  streamRecalculateQueueStats = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const origin = req.headers.origin || "http://localhost:3000";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", String(origin));
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setTimeout(0);

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    InventoryRecalculateQueue.registerSSEClient(res);

    req.on("close", () => {
      InventoryRecalculateQueue.unregisterSSEClient(res);
      res.end();
    });
  };
}
