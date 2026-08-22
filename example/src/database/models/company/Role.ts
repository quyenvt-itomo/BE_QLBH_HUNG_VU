import { Entity, Column, OneToMany } from "typeorm";
import {
  Module,
  PermissionStructure,
} from "@/shared/middleware/permission.middleware";
import { CompanyUser } from "../CompanyUser";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";

@Entity("roles")
export class Role extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "jsonb", default: {} })
  permissions: PermissionStructure;

  @Column({ type: "jsonb", default: () => "'[]'" })
  importExcel: Module[];

  @Column({ type: "jsonb", default: () => "'[]'" })
  exportExcel: Module[];

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => CompanyUser, (companyUser) => companyUser.role)
  companyUsers: CompanyUser[];
}
