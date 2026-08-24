import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Organization } from "./Organization";
import { User } from "./User";
import { Employee } from "./company/Employee";
import { Role } from "./company/Role";

// StoreUser entity for system, club, friend, and tournament notifications
@Entity("company_users")
export class StoreUser extends BaseEntity {
  @Column({ type: "uuid" })
  storeId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  employeeId: string | null;

  @Column({ type: "uuid", default: null, nullable: true })
  roleId: string | null;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Organization, (org) => org.companyUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "storeId" })
  company: Organization;

  @ManyToOne(() => User, (user) => user.companyUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "employeeId" })
  employee: Employee;

  @ManyToOne(() => Role, (role) => role.companyUsers, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "roleId" })
  role: Role;
}
