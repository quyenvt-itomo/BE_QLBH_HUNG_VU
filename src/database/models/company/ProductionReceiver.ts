import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Production } from "./Production";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { Organization, OrganizationSnapshot } from "../Organization";

export enum PackingTypeEnum {
  COIL = "COIL", // Cuộn - Tính theo Kg
  BUNDLE = "BUNDLE", // Bó - Tính theo thanh
}

@Entity("production_receivers")
export class ProductionReceiver extends BaseEntity {
  @Column({ type: "uuid" })
  productionId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  teamId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  teamSnapshot: OrganizationSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  operationId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  operationSnapshot: AttributeSnapshot | null;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Production, (production) => production.receivers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productionId" })
  production: Production;

  @ManyToOne(() => Organization, { onDelete: "SET NULL" })
  @JoinColumn({ name: "teamId" })
  team: Organization | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "operationId" })
  operation: Attribute | null;
}
