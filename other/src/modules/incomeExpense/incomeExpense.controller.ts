import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { IncomeExpenseService } from "./incomeExpense.service";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { Request, Response } from "express";
import { IncomeExpenseQueryDto } from "./incomeExpense.validator";

@injectable()
export class IncomeExpenseController extends BaseController<IncomeExpense> {
  protected service: IncomeExpenseService;
  constructor(
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseService)
    protected incomeExpenseService: IncomeExpenseService,
  ) {
    super();
    this.service = incomeExpenseService;
  }

  getAllWithPagination = async (
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as IncomeExpenseQueryDto; // Cast to any for simplicity

      const data = await this.service.findAllWithPagination(
        options,
        undefined,
        req,
      );

      const { totalIncome, totalExpense, filterItems } =
        await this.service.getFilterItemsAndTotal(options);

      return res.status(data.statusCode).json({
        ...data,
        summary: {
          totalIncome,
          totalExpense,
        },
        filterItems,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
}
