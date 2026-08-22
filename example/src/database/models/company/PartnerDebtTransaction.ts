import { Entity, Column, Index } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionTypeEnum } from "@/shared/constants/enum";

export enum PartnerDebtSideEnum {
  PAYABLE = "payable",
  RECEIVABLE = "receivable",
}

export enum PartnerDebtRefTypeEnum {
  INVOICE = "invoice", // Phát sinh từ hóa đơn
  PAYMENT = "payment", // Phát sinh từ phiếu thu/chi
  ADJUSTMENT = "adjustment", // điều chỉnh đầu/cuối kỳ
  DEBT_OFFSET = "debt_offset", // đối trừ payable <-> receivable
}

/**
 * Sổ phát sinh công nợ.
 * 1 phiếu nguồn (Order/Purchase/IE/Adjustment/Offset) → tạo 1‑N transaction.
 * Idempotent qua (refType, refId).
 */
@Entity("partner_debt_transactions")
@Index(["companyId", "occurredAt"])
@Index(["partnerId", "side", "occurredAt"])
@Index(["refType", "refId"])
@Index(["invoiceId", "side"])
export class PartnerDebtTransaction extends BaseEntity {
  @Column({ type: "uuid" })
  @Index()
  companyId: string;

  @Column({ type: "enum", enum: PartnerDebtSideEnum })
  side: PartnerDebtSideEnum;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  partnerId: string;

  @Column({ type: "enum", enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column(BaseNumericColumnOptions)
  amount: number;

  /**
   * Hóa đơn mà giao dịch này tác động (nullable khi điều chỉnh tổng / chưa phân bổ).
   * Tăng nợ từ hóa đơn luôn gắn invoiceId = chính hóa đơn đó;
   * giảm nợ từ phiếu thu/chi, đối trừ, điều chỉnh cũng gắn invoiceId để tính nợ theo từng hóa đơn.
   */
  @Column({ type: "uuid", nullable: true, default: null })
  invoiceId: string | null;

  @Column({ type: "varchar", length: 20 })
  refType: PartnerDebtRefTypeEnum;

  @Column({ type: "uuid" })
  refId: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode: string | null;
}
