import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";
import { TransactionType } from "@/shared/constants/enum";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";

/**
 * Phiếu điều chỉnh công nợ (đầu kỳ / cân số / mất mát…).
 * deltaAmount = |expected - counted|, type được suy ra ở service.
 */
@Entity("commission_debt_adjustments")
export class CommissionDebtAdjustment extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 25 })
  code: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  partnerContactId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerContactSnapshot: PartnerContactSnapshot | null;

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
  @ManyToOne(() => PartnerContact, { onDelete: "CASCADE" })
  @JoinColumn({ name: "partnerContactId" })
  partnerContact: PartnerContact;
}
