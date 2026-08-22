import { injectable, inject } from "inversify";
import { FundTransactionService } from "./fundTransaction.service";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
import { Request, Response, NextFunction } from "express";

@injectable()
export class FundTransactionController {
  protected service: FundTransactionService;
  constructor(
    @inject(FUND_TRANSACTION_TYPES.FundTransactionService)
    protected fundTransactionService: FundTransactionService,
  ) {
    this.service = fundTransactionService;
  }

  getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as any;
      const result = await this.service.getReport(query);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  getTransactionDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const query = req.query as any;
      const result = await this.service.getTransactionDetails(query);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}
