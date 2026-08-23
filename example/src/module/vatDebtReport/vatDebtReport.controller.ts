import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { VAT_DEBT_REPORT_TYPES } from "./vatDebtReport.types";
import { VatDebtReportService } from "./vatDebtReport.service";
import {
  VatDebtReportQueryDto,
  VatDebtDetailQueryDto,
} from "./vatDebtReport.validator";

@injectable()
export class VatDebtReportController {
  constructor(
    @inject(VAT_DEBT_REPORT_TYPES.VatDebtReportService)
    private service: VatDebtReportService,
  ) {}

  getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = req.storeContext?.storeId;
      const query = {
        ...(req.query as unknown as VatDebtReportQueryDto),
        storeId,
      } as VatDebtReportQueryDto;
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
        ...(req.query as unknown as VatDebtDetailQueryDto),
        storeId,
      } as VatDebtDetailQueryDto;
      const result = await this.service.getDetail(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };
}
