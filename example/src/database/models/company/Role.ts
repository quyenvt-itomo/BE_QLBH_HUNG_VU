import { Entity, Column, OneToMany } from "typeorm";
import {
  Module,
  PermissionStructure,
} from "@/shared/middleware/permission.middleware";
import { StoreUser } from "../StoreUser";
import { BaseEntityWithStore } from "./BaseEntityWithStore";

@Entity("roles")
export class Role extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "jsonb", default: {} })
  permissions: PermissionStructure;

  @Column({ type: "jsonb", default: () => "'[]'" })
  importExcel: Module[];

  @Column({ type: "jsonb", default: () => "'[]'" })
  exportExcel: Module[];

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => StoreUser, (companyUser) => companyUser.role)
  companyUsers: StoreUser[];
}
