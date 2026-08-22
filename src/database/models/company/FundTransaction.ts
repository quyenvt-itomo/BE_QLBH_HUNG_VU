import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, Index } from "typeorm";
import { TransactionTypeEnum } from "@/shared/constants/enum";

export enum FundTransactionRefTypeEnum {
  INCOME = "income",
  EXPENSE = "expense",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
  LOAN = "loan",
  TERM_DEPOSIT = "term_deposit",
}

@Entity("fund_transactions")
@Index(["companyId", "occurredAt"])
@Index(["fundId", "occurredAt"])
@Index(["refType", "refId"])
export class FundTransaction extends BaseEntity {
  @Column({ type: "uuid" })
  @Index()
  companyId: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  fundId: string;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column({ type: "varchar", length: 20 })
  refType: FundTransactionRefTypeEnum;

  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
