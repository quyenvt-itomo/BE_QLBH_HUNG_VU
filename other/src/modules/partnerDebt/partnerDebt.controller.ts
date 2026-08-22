import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { PARTNER_DEBT_TYPES } from "./partnerDebt.types";
import { PartnerDebtService } from "./partnerDebt.service";
import {
  GetPartnerDebtReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./partnerDebt.validator";
import { BadRequestError } from "@/shared/types/errors";

/**
 * PartnerDebt Controller
 * Xử lý các request liên quan đến báo cáo tồn kho
 */
@injectable()
export class PartnerDebtController {
  constructor(
    @inject(PARTNER_DEBT_TYPES.PartnerDebtService)
    private partnerDebtService: PartnerDebtService,
  ) {}

  /**
   * GET /api/client/partner-debt/report
   * Báo cáo công nợ theo partner
   */
  getPartnerDebtReport = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery =
        req.query as unknown as GetPartnerDebtReportQueryDto;

      const result =
        await this.partnerDebtService.getPartnerDebtReport(validatedQuery);

      res.json({
        statusCode: 200,
        success: true,
        data: result.data,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new BadRequestError("Invalid query parameters", error.errors);
      }
      throw error;
    }
  };

  /**
   * GET /api/client/partner-debt/transactions
   * Chi tiết transactions (tổng hợp nhập xuất)
   */
  getTransactionDetails = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery =
        req.query as unknown as GetTransactionDetailsQueryDto;

      const result =
        await this.partnerDebtService.getTransactionDetails(validatedQuery);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new BadRequestError("Invalid query parameters", error.errors);
      }
      throw error;
    }
  };
}
