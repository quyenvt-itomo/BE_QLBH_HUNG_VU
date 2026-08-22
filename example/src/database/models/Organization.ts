import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Address } from "@/shared/base/BaseValidator";
import { TeamOperation } from "./TeamOperation";
import { CompanyUser } from "./CompanyUser";
import { Role } from "./company/Role";
import { Employee } from "./company/Employee";

export enum OrganizationTypeEnum {
  HEADQUARTER = "headquarter",
  COMPANY = "company",
  BRANCH = "branch",
  DEPARTMENT = "department",
  FACTORY = "factory",
  TEAM = "team",
}

export const CompanyType = [
  OrganizationTypeEnum.HEADQUARTER,
  OrganizationTypeEnum.COMPANY,
];

export const DepartmentLikeType = [
  OrganizationTypeEnum.BRANCH,
  OrganizationTypeEnum.DEPARTMENT,
  OrganizationTypeEnum.FACTORY,
];

export interface OrganizationSnapshot {
  id: string;
  name: string;
  code: string;
  type: OrganizationTypeEnum;
}

@Entity("organizations")
export class Organization extends BaseEntity {
  @Column({ type: "uuid", nullable: true, default: null })
  parentId: string | null;

  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 20 })
  type: OrganizationTypeEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  managerId: string | null; // Trưởng đơn vị

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 15, nullable: true, default: null })
  phone: string | null;

  // Dành cho tổng công ty và công ty
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  taxCode: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  address: Address | null;

  // Dành cho chi nhánh, phòng ban, nhà máy, team
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  industry: string | null; // Chuyên ngành
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  responsibility: string | null; // Chức năng, nhiệm vụ chính

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  establishment: string | null; // Cơ sở thành lập

  // =============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Organization, (org) => org.children, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parentId" })
  parent: Organization | null;

  @ManyToOne(() => Employee, (emp) => emp.company, { onDelete: "SET NULL" })
  @JoinColumn({ name: "managerId" })
  manager: Employee | null;

  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  @OneToMany(() => TeamOperation, (teamOp) => teamOp.team, { cascade: true })
  operations: TeamOperation[];

  @OneToMany(() => CompanyUser, (companyUser) => companyUser.company)
  companyUsers: CompanyUser[];

  @OneToMany(() => Role, (role) => role.company, { cascade: true })
  roles: Role[];
}
