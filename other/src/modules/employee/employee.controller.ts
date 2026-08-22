import { injectable, inject } from "inversify";
import { EmployeeService } from "./employee.service";
import { BaseController } from "@/shared/base/BaseController";
import { EMPLOYEE_TYPES } from "./employee.types";
import { Employee } from "@/database/models/store/Employee";

@injectable()
export class EmployeeController extends BaseController<Employee> {
  protected service: EmployeeService;

  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeService) employeeService: EmployeeService,
  ) {
    super();
    this.service = employeeService;
  }
}
