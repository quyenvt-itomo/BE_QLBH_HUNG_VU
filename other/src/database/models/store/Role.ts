import { Entity, Column } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { PermissionStructure } from "@/shared/middleware/permission.middleware";

@Entity("roles")
export class Role extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "jsonb", default: {} })
  permissions: PermissionStructure;
}
