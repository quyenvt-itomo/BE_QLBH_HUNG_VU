import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { EmployeeRepository } from "./employee.repository";
import { EMPLOYEE_TYPES } from "./employee.types";
import { Employee } from "@/database/models/store/Employee";

/**
 * Employee Service -  Entity
 */
@injectable()
export class EmployeeService extends BaseService<Employee> {
  protected repository: EmployeeRepository;
  protected uniqueFields: (keyof Employee)[] = [
    "code",
    "email",
    "phone",
    "identityNumber",
  ];
  protected uniqueScope: (keyof Employee)[] = ["storeId"];
  protected searchableFields = [
    "code",
    "name",
    "email",
    "phone",
    "identityNumber",
    "note",
  ];

  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    employeeRepository: EmployeeRepository,
  ) {
    super();
    this.repository = employeeRepository;
  }
}
