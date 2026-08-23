import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Attribute } from "./Attribute";
import {
  IAddress,
  IBankAccount,
  IRepresentative,
} from "@/shared/base/BaseValidator";
import { PartnerContact } from "./PartnerContact";
import { PartnerSubType } from "./PartnerSubType";
import { PartnerTypeEnum } from "@/shared/constants/enum";
import { LoyaltyPointAdjustment } from "./LoyaltyPointAdjustment";
import { PartnerDebtAdjustment } from "./store/PartnerDebtAdjustment";

@Entity("partners")
export class Partner extends BaseEntity {
  @Column({ type: "enum", enum: PartnerTypeEnum })
  type: PartnerTypeEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;

  @Column({ type: "boolean", default: true })
  isOrganization: boolean;

  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;
  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;
  @Column({ type: "varchar", length: 20, nullable: true })
  taxCode: string | null; // mã số thuế
  @Column({ type: "jsonb", default: [] })
  addresses: IAddress[]; // danh sách địa chỉ
  @Column({ type: "jsonb", nullable: true, default: null })
  representative: IRepresentative | null; // người đại diện
  @Column({
    type: "jsonb",
    nullable: true,
    default: [],
  })
  banks: IBankAccount[];

  @Column(BaseNullableNumericColumnOptions)
  maxDebtAmount: number | null;

  // TODO ===== Loyalty Points =====
  @Column(BaseNumericColumnOptions)
  loyaltyPoints: number; // Số điểm tích lũy hiện có

  @Column(BaseNumericColumnOptions)
  totalRevenue: number; // Tổng doanh số tích lũy (dùng để tính điểm)

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  group?: Attribute | null;

  @OneToMany(() => PartnerContact, (contact) => contact.partner, {
    cascade: true,
  })
  contacts: PartnerContact[];

  @OneToMany(() => PartnerSubType, (subType) => subType.partner, {
    cascade: true,
  })
  subTypes: PartnerSubType[];

  @OneToMany(() => LoyaltyPointAdjustment, (adjustment) => adjustment.partner, {
    cascade: true,
  })
  loyaltyPointAdjustments: LoyaltyPointAdjustment[];

  @OneToMany(() => PartnerDebtAdjustment, (debt) => debt.partner, {
    cascade: true,
  })
  partnerDebtAdjustments: PartnerDebtAdjustment[];
}
