import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { COMMISSION_DEBT_REPORT_TYPES } from "./commissionDebtReport.types";
import { CommissionDebtReportService } from "./commissionDebtReport.service";
import {
  CommissionDebtReportQueryDto,
  CommissionDebtDetailQueryDto,
} from "./commissionDebtReport.validator";

@injectable()
export class CommissionDebtReportController {
  constructor(
    @inject(COMMISSION_DEBT_REPORT_TYPES.CommissionDebtReportService)
    private service: CommissionDebtReportService,
  ) {}

  getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = req.storeContext?.storeId;
      const query = {
        ...(req.query as unknown as CommissionDebtReportQueryDto),
        storeId,
      } as CommissionDebtReportQueryDto;
      const result = await this.service.getReport(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };

  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = req.storeContext?.storeId;
      const query = {
        ...(req.query as unknown as CommissionDebtDetailQueryDto),
        storeId,
      } as CommissionDebtDetailQueryDto;
      const result = await this.service.getDetail(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };
}
