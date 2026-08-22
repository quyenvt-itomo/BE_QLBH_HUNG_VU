import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { EMPLOYEE_TYPES } from "./employee.types";
import { EmployeeController } from "./employee.controller";
import {
  CreateEmployeeSchema,
  EmployeeParamsSchema,
  EmployeeQuerySchema,
  UpdateEmployeeSchema,
} from "./employee.validator";

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
    this.router.get(
      "/",
      permissionMiddleware("employee", "read"),
      zodValidate(EmployeeQuerySchema, "query"),
      this.employeeController.getAllWithPagination,
    );

    this.router.post(
      "/",
      permissionMiddleware("employee", "create"),
      zodValidate(CreateEmployeeSchema, "body"),
      this.employeeController.create,
    );

    this.router.get(
      "/:id",
      permissionMiddleware("employee", "read"),
      zodValidate(EmployeeParamsSchema, "params"),
      this.employeeController.getById,
    );

    this.router.put(
      "/:id",
      permissionMiddleware("employee", "update"),
      zodValidate(EmployeeParamsSchema, "params"),
      zodValidate(UpdateEmployeeSchema, "body"),
      this.employeeController.update,
    );

    this.router.delete(
      "/:id",
      permissionMiddleware("employee", "delete"),
      zodValidate(EmployeeParamsSchema, "params"),
      this.employeeController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
