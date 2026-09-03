import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Partner } from "./Partner";
import { BankAccount } from "@/shared/base/BaseValidator";

@Entity("partner_contacts")
export class PartnerContact extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  phone: string | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  identityCode: string | null;

  @Column({ type: "jsonb", nullable: true, default: [] })
  banks: BankAccount[];

  @Column({ type: "uuid" })
  partnerId: string;
  @ManyToOne(() => Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;
}
