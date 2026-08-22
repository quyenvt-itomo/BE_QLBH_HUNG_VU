import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Partner, PartnerSnapshot } from "./Partner";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { PartnerDebtOffsetLine } from "./PartnerDebtOffsetLine";

/**
 * Phiếu đối trừ công nợ payable ↔ receivable cho cùng 1 partner.
 * Đối trừ theo từng hóa đơn: mỗi phiếu có 2 danh sách dòng
 * (hóa đơn đầu vào payable - hóa đơn đầu ra receivable),
 * tổng giá trị giảm trừ của 2 bên phải bằng nhau (= offsetAmount).
 * Mỗi dòng sinh 1 transaction DECREASE (OUT) cho chính hóa đơn đó.
 */
@Entity("partner_debt_offsets")
export class PartnerDebtOffset extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 25 })
  code: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  partnerId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  /** Tổng giá trị giảm trừ phía PAYABLE (= sum(payableLines.amount)). */
  @Column({ ...BaseNumericColumnOptions, default: 0 })
  payableTotalAmount: number;

  /** Tổng giá trị giảm trừ phía RECEIVABLE (= sum(receivableLines.amount)). */
  @Column({ ...BaseNumericColumnOptions, default: 0 })
  receivableTotalAmount: number;

  /** Số tiền đối trừ thực tế = payableTotalAmount = receivableTotalAmount. */
  @Column(BaseNumericColumnOptions)
  offsetAmount: number;

  /** Số dư PAYABLE tại thời điểm offset (snapshot, để vẫn hiển thị được khi dữ liệu thay đổi). */
  @Column(BaseNumericColumnOptions)
  payableDebtAmount: number;

  /** Số dư RECEIVABLE tại thời điểm offset (snapshot). */
  @Column(BaseNumericColumnOptions)
  receivableDebtAmount: number;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;

  @OneToMany(() => PartnerDebtOffsetLine, (line) => line.offset)
  lines: PartnerDebtOffsetLine[];
}
