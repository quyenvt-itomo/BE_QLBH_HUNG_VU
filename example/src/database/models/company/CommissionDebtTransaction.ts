import { Entity, Column, Index } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionTypeEnum } from "@/shared/constants/enum";

export enum CommissionDebtRefTypeEnum {
  ORDER = "order", // SALE -> phát sinh công nợ hoa hồng
  PURCHASE = "purchase", // -> phát sinh công nợ hoa hồng
  PAYMENT = "payment", // Phát sinh từ phiếu thu/chi
  ADJUSTMENT = "adjustment", // điều chỉnh đầu/cuối kỳ
}

/**
 * Sổ phát sinh công nợ.
 * 1 phiếu nguồn (Order/Purchase/IE/Adjustment/Offset) → tạo 1‑N transaction.
 * Idempotent qua (refType, refId).
 */
@Entity("commission_debt_transactions")
@Index(["companyId", "occurredAt"])
@Index(["partnerContactId", "occurredAt"])
@Index(["refType", "refId"])
export class CommissionDebtTransaction extends BaseEntity {
  @Column({ type: "uuid" })
  @Index()
  companyId: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  partnerContactId: string;

  @Column({ type: "enum", enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "varchar", length: 20 })
  refType: CommissionDebtRefTypeEnum;

  @Column({ type: "uuid" })
  refId: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode: string | null;
}
