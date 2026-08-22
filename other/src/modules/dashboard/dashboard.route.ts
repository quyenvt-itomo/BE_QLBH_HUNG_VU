import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  DashboardProductParamsSchema,
  DashboardQuerySchema,
} from "./dashboard.validator";
import { DashboardController } from "./dashboard.controller";
import { DashboardRepository } from "./dashboard.repository";
import { DASHBOARD_TYPES } from "./dashboard.types";

@injectable()
export class DashboardRouter {
  private router: Router;

  constructor(
    @inject(DASHBOARD_TYPES.DashboardController)
    private dashboardController: DashboardController,
    @inject(DASHBOARD_TYPES.DashboardRepository)
    protected dashboardRepository: DashboardRepository,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All dashboard routes require authentication
    // this.router.use(authenticate);

    // GET /dashboard/overview - Get overview dashboard
    this.router.get(
      "/overview",
      zodValidate(DashboardQuerySchema, "query"),
      this.dashboardController.getOverview,
    );

    // GET /dashboard/profit - Get profit report
    this.router.get(
      "/profit",
      zodValidate(DashboardQuerySchema, "query"),
      this.dashboardController.getProfitReport,
    );

    // GET /dashboard/sales - Get sales report (chỉ đơn bán, không có đơn hoàn)
    this.router.get(
      "/sales",
      zodValidate(DashboardQuerySchema, "query"),
      this.dashboardController.getSalesReport,
    );

    // GET /dashboard/product - Get product report (bao gồm cả doanh thu, số lượng bán, tồn kho,...)
    this.router.get(
      "/product",
      zodValidate(DashboardQuerySchema, "query"),
      this.dashboardController.getProductReport,
    );

    // GET /dashboard/product/:id - Get product detail report
    this.router.get(
      "/product/:id",
      zodValidate(DashboardProductParamsSchema, "params"),
      zodValidate(DashboardQuerySchema, "query"),
      this.dashboardController.getProductDetailReport,
    );

    // // GET /dashboards - Get all dashboards with filters
    // this.router.get(
    //   "/",
    //   zodValidate(DashboardQuerySchema, "query"),
    //   this.dashboardController.getDashboard,
    // );
  }

  public getRouter(): Router {
    return this.router;
  }
}
