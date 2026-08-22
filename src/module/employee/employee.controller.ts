import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Employee } from "@/database/models/company/Employee";
import { EmployeeService } from "./employee.service";
import { EMPLOYEE_TYPES } from "./employee.types";

@injectable()
export class EmployeeController extends BaseController<Employee> {
  protected service: EmployeeService;

  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeService) service: EmployeeService,
  ) {
    super();
    this.service = service;
  }
}
