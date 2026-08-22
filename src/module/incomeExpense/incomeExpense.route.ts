import { Router } from "express";
import { injectable, inject } from "inversify";
import { IncomeExpenseController } from "./incomeExpense.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateIncomeExpenseSchema,
  UpdateIncomeExpenseSchema,
  IncomeExpenseQuerySchema,
  IncomeExpenseParamsSchema,
} from "./incomeExpense.validator";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

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
      permissionMiddleware("incomeExpense", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateIncomeExpenseSchema, "body"),
      permissionMiddleware("incomeExpense", "create"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      permissionMiddleware("incomeExpense", "read"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      zodValidate(UpdateIncomeExpenseSchema, "body"),
      permissionMiddleware("incomeExpense", "update"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      permissionMiddleware("incomeExpense", "delete"),
      this.controller.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
