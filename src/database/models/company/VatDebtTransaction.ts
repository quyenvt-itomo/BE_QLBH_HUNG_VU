import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { TransactionTypeEnum } from "@/shared/constants/enum";

export enum VatTransactionTypeEnum {
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
  companyId: string;

  @Column({ type: "enum", enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: VatTransactionTypeEnum })
  refType: VatTransactionTypeEnum;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
