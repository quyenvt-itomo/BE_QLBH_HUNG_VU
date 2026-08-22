import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Partner } from "./Partner";
import { Attribute } from "./Attribute";
import { PartnerTypeEnum } from "@/shared/constants/enum";

@Entity("partner_sub_types")
export class PartnerSubType extends BaseEntity {
  @Column({ type: "enum", enum: PartnerTypeEnum })
  type: PartnerTypeEnum; // Phải khách với type chính của Partner

  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;

  @Column({ type: "uuid" })
  partnerId: string;

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Partner, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;

  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  group?: Attribute | null; // Nhóm đối tác, phụ thuộc vào  type => attribute.type tương ứng
}
