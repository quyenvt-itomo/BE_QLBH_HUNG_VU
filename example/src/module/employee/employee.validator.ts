import { z } from "zod";
import {
  AddressSchema,
  BankAccountSchema,
  BaseCodeSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  CompensationSchema,
  DateTransform,
  EducationInfoSchema,
  IdentificationSchema,
  InsuranceInfoSchema,
  RepresentativeSchema,
} from "@/shared/base/BaseValidator";
import {
  EmployeeStatus,
  MaritalStatusEnum,
  WorkingStatusEnum,
} from "@/database/models/company/Employee";
import { EmployeeContractTypeEnum } from "@/database/models/company/EmployeeContract";
import { GenderEnum } from "@/shared/constants/enum";

export const CreateEmployeeContractSchema = BaseCreateSchema.extend({
  contractNumber: z.string("Số hợp đồng không hợp lệ").trim().max(255),
  type: z
    .enum(EmployeeContractTypeEnum)
    .optional()
    .default(EmployeeContractTypeEnum.OFFICIAL),
  salary: z.number().nonnegative(),
  startDate: DateTransform.nullish(),
  endDate: DateTransform.nullish(),
});

export const UpdateEmployeeContractSchema = CreateEmployeeContractSchema.extend(
  {
    id: z.uuid().optional(),
  },
);

export const CreateEmployeeSchema = BaseCreateSchema.extend({
  companyId: z.uuid(),
  code: BaseCodeSchema.optional(),
  name: z.string().trim().max(255),
  gender: z.enum(GenderEnum).nullish(),
  dob: DateTransform.nullish(),
  maritalStatus: z.enum(MaritalStatusEnum).nullish(),
  ethnicity: z.string().trim().max(255).nullish(),
  religion: z.string().trim().max(255).nullish(),
  taxCode: z.string().trim().max(50).nullish(),
  identification: IdentificationSchema.nullish(),
  education: EducationInfoSchema.nullish(),
  email: z.email().nullish(),
  phone: z.string().trim().max(20).nullish(),
  permanentAddress: AddressSchema.nullish(),
  currentAddress: AddressSchema.nullish(),
  emergencyContact: RepresentativeSchema.nullish(),
  workingOrganizationId: z.uuid().nullish(),
  jobPositionId: z.uuid().nullish(),
  baseSalary: z.number().nonnegative().nullish(),
  workingStatus: z.enum(WorkingStatusEnum).nullish(),
  employeeStatus: z.enum(EmployeeStatus).nullish(),
  trialDate: DateTransform.nullish(),
  officialDate: DateTransform.nullish(),
  allowances: z.array(CompensationSchema).nullish(),
  deductions: z.array(CompensationSchema).nullish(),
  bankAccount: BankAccountSchema.nullish(),
  insuranceInfo: InsuranceInfoSchema.nullish(),
  contracts: z.array(CreateEmployeeContractSchema).optional(),
});

export const UpdateEmployeeSchema = BaseUpdateSchema.extend({
  code: BaseCodeSchema.optional(),
  name: z.string().trim().max(255).optional(),
  gender: z.enum(GenderEnum).nullish(),
  dob: DateTransform.nullish(),
  maritalStatus: z.enum(MaritalStatusEnum).nullish(),
  ethnicity: z.string().trim().max(255).nullish(),
  religion: z.string().trim().max(255).nullish(),
  taxCode: z.string().trim().max(50).nullish(),
  identification: IdentificationSchema.nullish(),
  education: EducationInfoSchema.nullish(),
  email: z.email().nullish(),
  phone: z.string().trim().max(20).nullish(),
  permanentAddress: AddressSchema.nullish(),
  currentAddress: AddressSchema.nullish(),
  emergencyContact: RepresentativeSchema.nullish(),
  workingOrganizationId: z.uuid().nullish(),
  jobPositionId: z.uuid().nullish(),
  baseSalary: z.number().nonnegative().nullish(),
  workingStatus: z.enum(WorkingStatusEnum).nullish(),
  employeeStatus: z.enum(EmployeeStatus).nullish(),
  trialDate: DateTransform.nullish(),
  officialDate: DateTransform.nullish(),
  allowances: z.array(CompensationSchema).nullish(),
  deductions: z.array(CompensationSchema).nullish(),
  bankAccount: BankAccountSchema.nullish(),
  insuranceInfo: InsuranceInfoSchema.nullish(),
  contracts: z.array(UpdateEmployeeContractSchema).optional(),
});

export const EmployeeQuerySchema = BaseQuerySchema.extend({
  companyId: z.uuid().optional(),
  workingOrganizationId: z.uuid().optional(),
  jobPositionId: z.uuid().optional(),
  workingStatus: z.enum(WorkingStatusEnum).optional(),
  employeeStatus: z.enum(EmployeeStatus).optional(),
});

export const EmployeeParamsSchema = BaseParamsSchema;

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeQueryDto = z.infer<typeof EmployeeQuerySchema>;
export type EmployeeParamsDto = z.infer<typeof EmployeeParamsSchema>;
