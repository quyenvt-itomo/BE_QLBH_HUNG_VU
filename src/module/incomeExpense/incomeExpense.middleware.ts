import { IncomeExpenseType } from "@/database/models";
import { Request, Response, NextFunction } from "express";

export type IncomeExpenseModule = "income" | "expense";
declare module "express-serve-static-core" { interface Request { incomeExpenseContext?: { module: IncomeExpenseModule; type: IncomeExpenseType } } }
export const incomeExpenseContextMiddleware = (module: IncomeExpenseModule) => (req: Request, _res: Response, next: NextFunction) => {
  const type = module === "income" ? IncomeExpenseType.INCOME : IncomeExpenseType.EXPENSE;
  req.incomeExpenseContext = { module, type };
  const target = req.method === "GET" ? req.query : req.body;
  if (!target.type) target.type = type;
  next();
};
