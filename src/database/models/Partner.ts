import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import {
  BaseEntity,
  BaseNullableNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { Attribute } from "./Attribute";
import {
  Address,
  BankAccount,
  Representative,
} from "@/shared/base/BaseValidator";
import { PartnerContact } from "./PartnerContact";
import { DebtAdjustment } from "./DebtAdjustment";
import { Gender } from "@/shared/constants/enum";

export enum PartnerType {
  CUSTOMER = "customer", // khách hàng
  SUPPLIER = "supplier", // nhà cung cấp
  SHIPPER = "shipper", // đơn vị vận chuyển
}

export interface PartnerSnapshot {
  id: string;
  type: PartnerType;
  groupId: string | null;
  isOrganization: boolean;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  taxCode: string | null;
  identityCode: string | null;
  gender: Gender | null;
  dob: Date | null;
  addresses: Address[];
  representative: Representative | null;
  banks: BankAccount[];
}

@Entity("partners")
export class Partner extends BaseEntity {
  @Column({ type: "enum", enum: PartnerType })
  type: PartnerType;

  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "groupId" })
  group: Attribute | null;

  @Column({ type: "boolean", default: true })
  isOrganization: boolean;

  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;
  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;
  @Column({ type: "varchar", length: 20, nullable: true })
  taxCode: string | null; // mã số thuế
  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  identityCode: string | null;

  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  gender: Gender | null;
  @Column({ type: "timestamptz", nullable: true, default: null })
  dob: Date | null;

  @Column({ type: "jsonb", default: [] })
  addresses: Address[]; // danh sách địa chỉ
  @Column({ type: "jsonb", nullable: true, default: null })
  representative: Representative | null; // người đại diện
  @Column({ type: "jsonb", nullable: true, default: [] })
  banks: BankAccount[];

  @Column(BaseNullableNumericColumnOptions)
  maxDebtAmount: number | null;

  @OneToMany(() => PartnerContact, (contact) => contact.partner, {
    cascade: true,
  })
  contacts: PartnerContact[];

  @OneToMany(() => DebtAdjustment, (da) => da.partner, { cascade: true })
  debtAdjustments: DebtAdjustment[];

  // TODO: More fields
  payableDebtAmount?: number;
  receivableDebtAmount?: number;
}
