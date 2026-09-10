import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { DashboardService } from "./dashboard.service";
import { DASHBOARD_TYPES } from "./dashboard.types";
import {
  DashboardMetricsQueryDto,
  DashboardRevenueQueryDto,
  DashboardTopCustomerQueryDto,
  DashboardTopProductQueryDto,
} from "./dashboard.validator";

const getTimezone = (req: Request, queryTimezone?: string): string | undefined =>
  queryTimezone || (req.headers["x-timezone"] as string | undefined);

@injectable()
export class DashboardController {
  constructor(
    @inject(DASHBOARD_TYPES.Service)
    private service: DashboardService,
  ) {}

  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as DashboardMetricsQueryDto;
    const data = await this.service.getMetrics(
      req.storeContext?.storeId,
      getTimezone(req, query.timezone),
    );
    res.json({ success: true, statusCode: 200, message: "OK", data });
  });

  getRevenue = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as DashboardRevenueQueryDto;
    const data = await this.service.getRevenue(
      req.storeContext?.storeId,
      getTimezone(req, query.timezone),
      query.timeView,
      query.typeView,
      query.typeCal,
    );
    res.json({ success: true, statusCode: 200, message: "OK", data });
  });

  getTopProducts = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as DashboardTopProductQueryDto;
    const data = await this.service.getTopProducts(
      req.storeContext?.storeId,
      getTimezone(req, query.timezone),
      query.timeView,
      query.typeCal,
    );
    res.json({ success: true, statusCode: 200, message: "OK", data });
  });

  getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as DashboardTopCustomerQueryDto;
    const data = await this.service.getTopCustomers(
      req.storeContext?.storeId,
      getTimezone(req, query.timezone),
      query.timeView,
    );
    res.json({ success: true, statusCode: 200, message: "OK", data });
  });
}
