import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { VAT_DEBT_TYPES } from "./vatDebt.types";
import { VatDebtService } from "./vatDebt.service";
import {
  GetVatDebtQueryDto,
  GetVatDebtReportQueryDto,
} from "./vatDebt.validator";
import { BadRequestError } from "@/shared/types/errors";

/**
 * VatDebt Controller
 * Xử lý các request liên quan đến báo cáo tồn kho
 */
@injectable()
export class VatDebtController {
  constructor(
    @inject(VAT_DEBT_TYPES.VatDebtService)
    private vatDebtService: VatDebtService,
  ) {}

  /**
   * GET /api/client/vat-debt/report
   * Báo cáo công nợ theo vat
   */
  getVatDebtReport = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const validatedQuery = req.query as unknown as GetVatDebtReportQueryDto;

      const result = await this.vatDebtService.getVatDebtReport(validatedQuery);

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
   * GET /api/client/vat-debt/transactions
   * Chi tiết transactions (tổng hợp nhập xuất)
   */
  getDebtAtDate = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const { offsetAt = new Date(), storeId } =
        req.query as unknown as GetVatDebtQueryDto;

      const result = await this.vatDebtService.getDebtAtDate(offsetAt, storeId);

      res.json({
        success: true,
        data: {
          debtAmount: result,
        },
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new BadRequestError("Invalid query parameters", error.errors);
      }
      throw error;
    }
  };
}
