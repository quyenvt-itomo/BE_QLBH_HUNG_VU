import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Partner, PartnerSnapshot } from "./Partner";
import { TransactionType } from "@/shared/constants/enum";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { PartnerDebtSideEnum } from "./PartnerDebtTransaction";
import { InvoiceSnapshot } from "./Invoice";

/**
 * Phiếu điều chỉnh công nợ (đầu kỳ / cân số / mất mát…).
 * deltaAmount = |expected - counted|, type được suy ra ở service.
 * Có thể điều chỉnh cho riêng 1 hóa đơn (invoiceId) hoặc điều chỉnh tổng (invoiceId = null).
 */
@Entity("debt_adjustments")
export class PartnerDebtAdjustment extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 25 })
  code: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "enum", enum: PartnerDebtSideEnum })
  side: PartnerDebtSideEnum;

  @Column({ type: "uuid" })
  partnerId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  invoiceId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  invoiceSnapshot: InvoiceSnapshot | null;

  @Column(BaseNumericColumnOptions)
  expectedAmount: number;

  @Column(BaseNumericColumnOptions)
  countedAmount: number;

  @Column(BaseNumericColumnOptions)
  deltaAmount: number;

  @Column({
    type: "enum",
    enum: TransactionType,
    default: TransactionType.IN,
  })
  type: TransactionType;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @Column({ type: "boolean", default: false })
  isInitial: boolean;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner;
}
