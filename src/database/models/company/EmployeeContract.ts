import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Employee } from "./Employee";

export enum EmployeeContractTypeEnum {
  OFFICIAL = "official", // chính thức
  PROBATION = "probation", // thử việc
  INTERN = "intern", // thực tập
  FREELANCE = "freelance", // tự do
}

@Entity("employee_contracts")
export class EmployeeContract extends BaseEntity {
  @Column({ type: "uuid" })
  employeeId: string;

  @Column({ type: "varchar", length: 255 })
  contractNumber: string;

  @Column({
    type: "varchar",
    length: 50,
    default: EmployeeContractTypeEnum.OFFICIAL,
  })
  type: EmployeeContractTypeEnum;

  @Column(BaseNumericColumnOptions)
  salary: number;

  @Column({ type: "timestamptz", nullable: true, default: null })
  startDate: Date | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  endDate: Date | null;

  // ============================== RELATIONS ==============================
  @ManyToOne(() => Employee, (e) => e.contracts, { onDelete: "SET NULL" })
  @JoinColumn({ name: "employeeId" })
  employee: Employee | null;
}
