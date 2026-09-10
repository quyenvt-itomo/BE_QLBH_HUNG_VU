import { inject, injectable } from "inversify";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { BaseController } from "@/shared/base/BaseController";
import { IncomeExpenseService } from "./incomeExpense.service";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { IncomeExpenseQueryDto } from "./incomeExpense.validator";
import { Request, Response } from "express";
@injectable()
export class IncomeExpenseController extends BaseController<IncomeExpense> {
  protected service: IncomeExpenseService;
  constructor(@inject(INCOME_EXPENSE_TYPES.Service) service: IncomeExpenseService) { super(); this.service = service; }

  getAllWithPagination = async (
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as IncomeExpenseQueryDto;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findAllWithPagination(options as any, undefined, reqContext);
      if (data.data?.length) await this.service.hydrateEntities(data.data, reqContext);
      const { totalIncome, totalExpense, filterItems } =
        await this.service.getFilterItemsAndTotal(options, reqContext);
      return res.status(data.statusCode).json({
        ...data,
        summary: { totalIncome, totalExpense },
        filterItems,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
}
