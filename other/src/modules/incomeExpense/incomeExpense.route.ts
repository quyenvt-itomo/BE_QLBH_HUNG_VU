import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { IncomeExpenseController } from "./incomeExpense.controller";
import {
  CreateIncomeExpenseSchema,
  IncomeExpenseParamsSchema,
  IncomeExpenseQuerySchema,
  UpdateIncomeExpenseSchema,
} from "./incomeExpense.validator";

@injectable()
export class IncomeExpenseRouter {
  private router: Router;

  constructor(
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseController)
    private controller: IncomeExpenseController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(IncomeExpenseQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateIncomeExpenseSchema, "body"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      zodValidate(UpdateIncomeExpenseSchema, "body"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
