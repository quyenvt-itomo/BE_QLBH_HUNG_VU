import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionType } from "@/shared/constants/enum";

export enum VatTransactionType {
  PURCHASE_INVOICE = "purchase_invoice", // Phát sinh từ hóa đơn mua hàng
  SALES_INVOICE = "sales_invoice", // Phát sinh từ hóa đơn bán hàng
  ADJUSTMENT = "adjustment", // điều chỉnh đầu/cuối kỳ
  EXPENSE = "expense", // chi phí có VAT đầu vào không đủ điều kiện khấu trừ
}

@Entity("vat_debt_transactions")
export class VatDebtTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  storeId: string;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: VatTransactionType })
  refType: VatTransactionType;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
