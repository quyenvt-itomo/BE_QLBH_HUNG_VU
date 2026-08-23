import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity } from "typeorm";
import { TransactionType } from "@/shared/constants/enum";

export enum FundTransactionRefType {
  INCOME = "income",
  EXPENSE = "expense",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
}

@Entity("fund_transactions")
export class FundTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  fundId: string;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({ type: "enum", enum: FundTransactionRefType })
  refType: FundTransactionRefType;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
