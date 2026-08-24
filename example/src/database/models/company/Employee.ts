import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Gender } from "@/shared/constants/enum";
import {
  Address,
  BankAccount,
  Compensation,
  EducationInfo,
  Identification,
  InsuranceInfo,
  Representative,
} from "@/shared/base/BaseValidator";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Organization } from "../Organization";
import { JobPosition } from "./JobPosition";
import { EmployeeContract } from "./EmployeeContract";

export enum WorkingStatusEnum {
  WORKING = "working", // đang làm việc
  ON_LEAVE = "on_leave", // đang nghỉ phép
}

export enum EmployeeStatus {
  WORKING = "working", // đang làm việc
  RESIGNED = "resigned", // đã nghỉ việc
  RETIRED = "retired", // đã nghỉ hưu
  ON_LEAVE = "on_leave", // đang nghỉ phép
  PROBATION = "probation", // thử việc
  INTERN = "intern", // thực tập
  FREELANCE = "freelance", // tự do
}

export enum MaritalStatusEnum {
  SINGLE = "SINGLE", // Độc thân
  MARRIED = "MARRIED", // Đã kết hôn
  DIVORCED = "DIVORCED", // Đã ly hôn
}

export interface EmployeeSnapshot {
  id: string;
  code: string;
  name: string;
  gender: Gender | null;
  dob: Date | null;
  storeId: string;
}

@Entity("employees")
export class Employee extends BaseEntityWithStore {
  // TODO: THÔNG TIN CÁ NHÂN
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({
    type: "enum",
    enum: Gender,
    nullable: true,
    default: null,
  })
  gender: Gender | null;
  @Column({ type: "timestamptz", nullable: true, default: null })
  dob: Date | null;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  maritalStatus: MaritalStatusEnum | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  ethnicity: string | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  religion: string | null;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  taxCode: string | null;

  // TODO: THÔNG TIN ĐỊNH DANH
  @Column({ type: "jsonb", nullable: true, default: null })
  identification: Identification | null;

  // TODO: THÔNG TIN HỌC VẤN, BẰNG CẤP, CHỨNG CHỈ
  @Column({ type: "jsonb", nullable: true, default: null })
  education: EducationInfo | null;

  // TODO: THÔNG TIN LIÊN HỆ
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  phone: string | null;

  // TODO: Địa chỉ
  @Column({ type: "jsonb", nullable: true, default: null })
  permanentAddress: Address | null; // Địa chỉ thường trú
  @Column({ type: "jsonb", nullable: true, default: null })
  currentAddress: Address | null; // Nơi ở hiện tại

  // TODO: THÔNG TIN LIÊN HỆ KHẨN CẤP
  @Column({ type: "jsonb", nullable: true, default: null })
  emergencyContact: Representative | null;

  // TODO: THÔNG TIN CÔNG VIỆC
  @Column({ type: "uuid", nullable: true, default: null })
  workingOrganizationId: string | null;
  @Column({ type: "uuid", nullable: true, default: null })
  jobPositionId: string | null;
  @Column(BaseNumericColumnOptions)
  baseSalary: number | null;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  workingStatus: WorkingStatusEnum | null;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  employeeStatus: EmployeeStatus | null;
  @Column({ type: "timestamptz", nullable: true, default: null })
  trialDate: Date | null;
  @Column({ type: "timestamptz", nullable: true, default: null })
  officialDate: Date | null;

  // TODO: CÁC KHOẢN PHỤ CẤP
  @Column({ type: "jsonb", nullable: true, default: null })
  allowances: Compensation[] | null;

  // TODO: CÁC KHOẢN KHẤU TRỪ
  @Column({ type: "jsonb", nullable: true, default: null })
  deductions: Compensation[] | null;

  // TODO: THÔNG TIN NGÂN HÀNG
  @Column({ type: "jsonb", nullable: true, default: null })
  bankAccount: BankAccount | null;

  // TODO: THÔNG TIN BẢO HIỂM
  @Column({ type: "jsonb", nullable: true, default: null })
  insuranceInfo: InsuranceInfo | null;

  // ================= RELATIONS =================
  @ManyToOne(() => Organization, { onDelete: "SET NULL" })
  @JoinColumn({ name: "workingOrganizationId" })
  workingOrganization: Organization | null;

  @ManyToOne(() => JobPosition, { onDelete: "SET NULL" })
  @JoinColumn({ name: "jobPositionId" })
  jobPosition: JobPosition | null;

  @OneToMany(() => EmployeeContract, (contract) => contract.employee, {
    cascade: true,
  })
  contracts: EmployeeContract[];
}
