import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Organization } from "./Organization";
import { Attribute } from "./Attribute";
import { BaseEntity } from "@/shared/base/BaseEntity";

@Entity("team_operations")
export class TeamOperation extends BaseEntity {
  @Column({ type: "uuid" })
  teamId: string;

  @Column({ type: "uuid" })
  operationId: string;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Organization, (org) => org.operations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teamId" })
  team: Organization;

  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "operationId" })
  operation: Attribute;
}
