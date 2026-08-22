export const EMPLOYEE_TYPES = {
  EmployeeService: Symbol.for("EmployeeService"),
  EmployeeController: Symbol.for("EmployeeController"),
  EmployeeRepository: Symbol.for("EmployeeRepository"),
  EmployeeRouter: Symbol.for("EmployeeRouter"),
};

export interface EmployeeSnapshot {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  identityNumber: string | null;

  position: {
    id: string;
    name: string;
  } | null;
}
