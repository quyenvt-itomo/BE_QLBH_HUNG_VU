import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { PARTNER_DEBT_REPORT_TYPES } from "./partnerDebtReport.types";
import { PartnerDebtReportService } from "./partnerDebtReport.service";
import {
  PartnerDebtReportQueryDto,
  PartnerDebtDetailQueryDto,
  PartnerDebtListQueryDto,
  PartnerDebtInvoiceListQueryDto,
} from "./partnerDebtReport.validator";

@injectable()
export class PartnerDebtReportController {
  constructor(
    @inject(PARTNER_DEBT_REPORT_TYPES.PartnerDebtReportService)
    private service: PartnerDebtReportService,
  ) {}

  getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyContext?.companyId;
      const query = {
        ...(req.query as unknown as PartnerDebtReportQueryDto),
        companyId,
      } as PartnerDebtReportQueryDto;
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
        ...(req.query as unknown as PartnerDebtDetailQueryDto),
        companyId,
      } as PartnerDebtDetailQueryDto;
      const result = await this.service.getDetail(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };

  getPartnersWithDebt = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const companyId = req.companyContext?.companyId;
      const query = {
        ...(req.query as unknown as PartnerDebtListQueryDto),
        companyId,
      } as PartnerDebtListQueryDto;
      const result = await this.service.getPartnersWithDebt(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };

  getPartnerInvoices = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const companyId = req.companyContext?.companyId;
      const query = {
        ...(req.query as unknown as PartnerDebtInvoiceListQueryDto),
        companyId,
      } as PartnerDebtInvoiceListQueryDto;
      const result = await this.service.getPartnerInvoices(query);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  };
}
