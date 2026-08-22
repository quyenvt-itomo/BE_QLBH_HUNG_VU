import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Partner } from "./Partner";
import { BankAccount } from "@/shared/base/BaseValidator";

export interface PartnerContactSnapshot {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

@Entity("partner_contacts")
export class PartnerContact extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  phone: string | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;

  @Column({
    type: "jsonb",
    nullable: true,
    default: () => "'[]'",
    transformer: {
      to: (value: BankAccount[]) => value,
      from: (value: BankAccount[]) => value || [],
    },
  })
  banks: BankAccount[];

  @Column({ type: "uuid" })
  partnerId: string;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Partner, (partner) => partner.contacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;
}
