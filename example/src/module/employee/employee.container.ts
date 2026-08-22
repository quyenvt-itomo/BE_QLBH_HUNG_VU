import { ContainerModule } from "inversify";
import { EMPLOYEE_TYPES } from "./employee.types";
import { EmployeeController } from "./employee.controller";
import { EmployeeService } from "./employee.service";
import { EmployeeRepository } from "./employee.repository";
import { EmployeeRouter } from "./employee.route";

const employeeModule = new ContainerModule((bind) => {
  bind<EmployeeController>(EMPLOYEE_TYPES.EmployeeController).to(
    EmployeeController,
  );
  bind<EmployeeService>(EMPLOYEE_TYPES.EmployeeService).to(EmployeeService);
  bind<EmployeeRepository>(EMPLOYEE_TYPES.EmployeeRepository).to(
    EmployeeRepository,
  );
  bind<EmployeeRouter>(EMPLOYEE_TYPES.EmployeeRouter).to(EmployeeRouter);
});

export { employeeModule };
