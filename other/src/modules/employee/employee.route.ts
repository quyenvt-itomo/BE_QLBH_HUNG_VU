import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  EmployeeQuerySchema,
  EmployeeParamsSchema,
} from "./employee.validator";
import { EmployeeController } from "./employee.controller";
import { EMPLOYEE_TYPES } from "./employee.types";

@injectable()
export class EmployeeRouter {
  private router: Router;

  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeController)
    private employeeController: EmployeeController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All employee routes require authentication
    // this.router.use(authenticate);

    // GET /employees - Get all employees with filters
    this.router.get(
      "/",
      zodValidate(EmployeeQuerySchema, "query"),
      this.employeeController.getAllWithPagination,
    );

    // POST /employees - Create new employee
    this.router.post(
      "/",
      zodValidate(CreateEmployeeSchema, "body"),
      this.employeeController.create,
    );

    // GET /employees/:id - Get employee by ID
    this.router.get(
      "/:id",
      zodValidate(EmployeeParamsSchema, "params"),
      this.employeeController.getById,
    );

    // PUT /employees/:id - Update employee
    this.router.put(
      "/:id",
      zodValidate(EmployeeParamsSchema, "params"),
      zodValidate(UpdateEmployeeSchema, "body"),
      this.employeeController.update,
    );

    // DELETE /employees/:id - Delete employee
    this.router.delete(
      "/:id",
      zodValidate(EmployeeParamsSchema, "params"),
      this.employeeController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
