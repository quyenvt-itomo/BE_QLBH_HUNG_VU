import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { LOYALTY_POINT_TYPES } from "./loyaltyPoint.types";
import { LoyaltyPointService } from "./loyaltyPoint.service";
import { LoyaltyPointRecalculateService } from "./loyaltyPointRecalculate.service";
import {
  GetPartnerPointsReportQueryDto,
  GetTransactionDetailsQueryDto,
  RecalculateFromDateDto,
} from "./loyaltyPoint.validator";
import { BadRequestError } from "@/shared/types/errors";

/**
 * LoyaltyPoint Controller
 * Xử lý các request liên quan đến báo cáo tích điểm
 */
@injectable()
export class LoyaltyPointController {
  constructor(
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointService)
    private loyaltyPointService: LoyaltyPointService,
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService)
    private recalculateService: LoyaltyPointRecalculateService,
  ) {}

  /**
   * GET /api/client/loyalty-point/report
   * Báo cáo tích điểm theo partner
   */
  getPartnerPointsReport = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const validatedQuery =
        req.query as unknown as GetPartnerPointsReportQueryDto;

      const result =
        await this.loyaltyPointService.getPartnerPointsReport(validatedQuery);

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
   * GET /api/client/loyalty-point/transaction
   * Chi tiết giao dịch tích điểm
   */
  getTransactionDetails = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const validatedQuery =
        req.query as unknown as GetTransactionDetailsQueryDto;

      const result =
        await this.loyaltyPointService.getTransactionDetails(validatedQuery);

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

  /**
   * POST /api/client/loyalty-point/recalculate
   * Tính lại loyalty points và revenue từ một ngày
   */
  recalculateFromDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromDate, partnerIds } = req.body as RecalculateFromDateDto;

      const result = await this.recalculateService.recalculateFromDate(
        new Date(fromDate),
        undefined,
        partnerIds,
      );

      res.json({
        success: true,
        message: "Recalculate loyalty points thành công",
        data: result,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        throw new BadRequestError("Invalid request body", error.errors);
      }
      throw error;
    }
  };
}
