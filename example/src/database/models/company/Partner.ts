import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Attribute } from "../Attribute";
import {
  Address,
  BankAccount,
  Representative,
} from "@/shared/base/BaseValidator";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { Employee } from "./Employee";
import { PaymentTerm } from "./PaymentTerm";
import { PartnerContact } from "./PartnerContact";

export enum PartnerType {
  CUSTOMER = "customer", // Khách hàng
  SUPPLIER = "supplier", // Nhà cung cấp
  SHIPPING_PROVIDER = "shipping_provider", // Đơn vị vận chuyển
}

export interface PartnerSnapshot {
  id: string;
  name: string;
  code: string;
  taxCode: string | null;
  types: PartnerType[];
  email?: string | null;
  phone?: string | null;
  address: Address | null;

  representative: Representative | null;
}

@Entity("partners")
export class Partner extends BaseEntityWithStore {
  // TODO: THÔNG TIN CHUNG
  @Column({ type: "uuid", nullable: true, default: null })
  groupId: string | null;
  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "jsonb", default: () => "'[]'" })
  types: PartnerType[];
  @Column({ type: "varchar", length: 20, nullable: true })
  taxCode: string | null; // mã số thuế
  @Column({ type: "jsonb", nullable: true, default: null })
  address: Address | null; // địa chỉ
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null; // nhân viên phụ trách

  // TODO: ĐIỀU KHOẢN THANH TOÁN
  @Column({ type: "uuid", nullable: true, default: null })
  paymentTermId: string | null; // điều khoản thanh toán

  // TODO: NGƯỜI ĐẠI DIỆN
  @Column({ type: "jsonb", nullable: true, default: null })
  representative: Representative | null; // người đại diện

  // TODO: TÀI KHOẢN NGÂN HÀNG
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

  // TODO: THÔNG TIN LIÊN HỆ
  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;
  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;
  @Column({ type: "varchar", length: 255, nullable: true })
  zaloLink: string | null; // Link liên kết Zalo

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "groupId" })
  group?: Attribute | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff?: Employee | null;

  @ManyToOne(() => PaymentTerm, { onDelete: "SET NULL" })
  @JoinColumn({ name: "paymentTermId" })
  paymentTerm?: PaymentTerm | null;

  @OneToMany(() => PartnerContact, (contact) => contact.partner, {
    cascade: true,
  })
  contacts: PartnerContact[];
}
