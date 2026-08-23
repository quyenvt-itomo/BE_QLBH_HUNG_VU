import { Employee } from "@/database/models/company/Employee";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const EmployeeSelectBasic: FindOptionsSelect<Employee> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  name: true,
  gender: true,
  dob: true,
  maritalStatus: true,
  ethnicity: true,
  religion: true,
  taxCode: true,
  identification: true,
  education: true,
  email: true,
  phone: true,
  permanentAddress: true,
  currentAddress: true,
  emergencyContact: true,
  workingOrganizationId: true,
  jobPositionId: true,
  baseSalary: true,
  workingStatus: true,
  employeeStatus: true,
  trialDate: true,
  officialDate: true,
  allowances: true,
  deductions: true,
  bankAccount: true,
  insuranceInfo: true,
};

export const EmployeeSelectFull: FindOptionsSelect<Employee> = {
  ...EmployeeSelectBasic,
  company: true,
  workingOrganization: true,
  jobPosition: {
    jobTitle: true,
  },
  contracts: {
    ...BaseSelect,
    employeeId: true,
    contractNumber: true,
    type: true,
    salary: true,
    startDate: true,
    endDate: true,
  },
};

export const EmployeeRelations: FindOptionsRelations<Employee> = {
  company: true,
  workingOrganization: true,
  jobPosition: {
    jobTitle: true,
  },
  contracts: true,
};
