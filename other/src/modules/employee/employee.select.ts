import { Employee } from "@/database/models/store/Employee";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const EmployeeSelectBasic: FindOptionsSelect<Employee> = {
  ...BaseSelect,
  name: true,
  code: true,
  positionId: true,
  phone: true,
  email: true,
  dob: true,
  gender: true,
  position: true,
  hiredAt: true,
  isActive: true,
  status: true,
  terminateAt: true,
  storeId: true,
};

export const EmployeeSelectFull: FindOptionsSelect<Employee> = {
  ...EmployeeSelectBasic,
  store: true,
};

export const EmployeeRelations: FindOptionsRelations<Employee> = {
  position: true,
  store: true,
};
