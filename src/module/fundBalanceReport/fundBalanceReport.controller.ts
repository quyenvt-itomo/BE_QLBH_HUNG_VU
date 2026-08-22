import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { FUND_BALANCE_REPORT_TYPES } from "./fundBalanceReport.types";
import { FundBalanceReportService } from "./fundBalanceReport.service";
import {
  FundBalanceReportQueryDto,
  FundBalanceDetailQueryDto,
} from "./fundBalanceReport.validator";

@injectable()
export class FundBalanceReportController {
  constructor(
    @inject(FUND_BALANCE_REPORT_TYPES.FundBalanceReportService)
    private service: FundBalanceReportService,
  ) {}

  getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyContext?.companyId;
      const query = {
        ...(req.query as unknown as FundBalanceReportQueryDto),
        companyId,
      } as FundBalanceReportQueryDto;
      const result = await this.service.getReport(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };

  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyContext?.companyId;
      const query = {
        ...(req.query as unknown as FundBalanceDetailQueryDto),
        companyId,
      } as FundBalanceDetailQueryDto;
      const result = await this.service.getDetail(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };
}
