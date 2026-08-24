import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { incomeExpenseContextMiddleware } from "./incomeExpense.middleware";
import { IncomeExpenseController } from "./incomeExpense.controller";
import { INCOME_EXPENSE_TYPES } from "./incomeExpense.types";
@injectable()
export class IncomeExpenseRouter {
  private router = Router();
  constructor(@inject(INCOME_EXPENSE_TYPES.Controller) controller: IncomeExpenseController) {
    const permission = "incomeExpense" as const;
    const mount = (module: "income" | "expense") => {
      const child = Router();
      child.use(incomeExpenseContextMiddleware(module));
      child.get(
        "/",
        permissionMiddleware(permission, "read"),
        controller.getAllWithPagination,
      );
      child.get(
        "/:id",
        permissionMiddleware(permission, "read"),
        controller.getById,
      );
      child.post(
        "/",
        permissionMiddleware(permission, "create"),
        controller.create,
      );
      child.put(
        "/:id",
        permissionMiddleware(permission, "update"),
        controller.update,
      );
      child.patch(
        "/:id",
        permissionMiddleware(permission, "update"),
        controller.update,
      );
      child.delete(
        "/bulk",
        permissionMiddleware(permission, "delete"),
        controller.deleteMany,
      );
      child.delete(
        "/:id",
        permissionMiddleware(permission, "delete"),
        controller.delete,
      );
      this.router.use(`/${module}`, child);
    };
    mount("income");
    mount("expense");
  }
  getRouter() {
    return this.router;
  }
}
