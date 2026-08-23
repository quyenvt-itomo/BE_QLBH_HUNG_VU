import { Entity, Column, OneToMany } from "typeorm";
import { PermissionStructure } from "@/shared/middleware/permission.middleware";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";

export enum RoleType {
  SYSTEM = "system",
  STORE = "store",
}

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ type: "enum", enum: RoleType, default: RoleType.SYSTEM })
  type: RoleType;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "jsonb", default: {} })
  permissions: PermissionStructure;

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
