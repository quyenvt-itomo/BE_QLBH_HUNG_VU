import { Entity, Column } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { PermissionStructure } from "@/shared/middleware/permission.middleware";

@Entity("system_roles")
export class SystemRole extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "jsonb", default: {} })
  permissions: PermissionStructure;
}
