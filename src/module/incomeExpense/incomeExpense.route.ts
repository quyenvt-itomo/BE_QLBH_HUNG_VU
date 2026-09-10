import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { IncomeExpenseController } from "./incomeExpense.controller";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
import {
  CreateIncomeExpenseSchema,
  IncomeExpenseDeleteManySchema,
  IncomeExpenseParamsSchema,
  IncomeExpenseQuerySchema,
  UpdateIncomeExpenseSchema,
} from "./incomeExpense.validator";
@injectable()
export class IncomeExpenseRouter {
  private router = Router();
  constructor(@inject(INCOME_EXPENSE_TYPES.Controller) controller: IncomeExpenseController) {
    const permission = "incomeExpense" as const;
    this.router.get(
      "/",
      zodValidate(IncomeExpenseQuerySchema, "query"),
      permissionMiddleware(permission, "read"),
      controller.getAllWithPagination,
    );
    this.router.get(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      permissionMiddleware(permission, "read"),
      controller.getById,
    );
    this.router.post(
      "/",
      zodValidate(CreateIncomeExpenseSchema, "body"),
      permissionMiddleware(permission, "create"),
      controller.create,
    );
    this.router.put(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      zodValidate(UpdateIncomeExpenseSchema, "body"),
      permissionMiddleware(permission, "update"),
      controller.update,
    );
    this.router.patch(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      zodValidate(UpdateIncomeExpenseSchema, "body"),
      permissionMiddleware(permission, "update"),
      controller.update,
    );
    this.router.delete(
      "/bulk",
      zodValidate(IncomeExpenseDeleteManySchema, "body"),
      permissionMiddleware(permission, "delete"),
      controller.deleteMany,
    );
    this.router.delete(
      "/:id",
      zodValidate(IncomeExpenseParamsSchema, "params"),
      permissionMiddleware(permission, "delete"),
      controller.delete,
    );
  }
  getRouter() {
    return this.router;
  }
}
