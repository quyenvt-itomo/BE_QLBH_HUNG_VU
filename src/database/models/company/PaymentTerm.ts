import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Partner } from "./Partner";

export interface PaymentTermSnapshot {
  id: string;
  code: string;
  name: string;
  depositRate: number;
  maxDebtDays: number;
  maxDebtAmount: number;
}

@Entity("payment_terms")
export class PaymentTerm extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 20 })
  code: string;

  // % Tỷ lệ Phải đặt cọc cho mỗi đơn hàng
  @Column(BaseNumericColumnOptions)
  depositRate: number;

  // Số ngày nợ tối đa
  @Column({ type: "int", default: 0 })
  maxDebtDays: number;

  // Số tiền nợ tối đa
  @Column(BaseNumericColumnOptions)
  maxDebtAmount: number;

  // ========================= RELATIONS ========================= //
  @OneToMany(() => Partner, (partner) => partner.paymentTerm)
  partners: Partner[];
}
