import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { DashboardService } from "./dashboard.service";
import { DASHBOARD_TYPES } from "./dashboard.types";

@injectable()
export class DashboardController {
  constructor(
    @inject(DASHBOARD_TYPES.DashboardService)
    protected service: DashboardService,
  ) {}

  getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getOverview(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getProfitReport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getProfitReport(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getSalesReport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getSalesReport(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getProductReport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getProductReport(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getProductDetailReport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getProductDetailReport(
        req.params.id,
        req.query as any,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
