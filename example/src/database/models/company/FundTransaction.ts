import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, Index } from "typeorm";
import { TransactionType } from "@/shared/constants/enum";

export enum FundTransactionRefTypeEnum {
  INCOME = "income",
  EXPENSE = "expense",
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
  LOAN = "loan",
  TERM_DEPOSIT = "term_deposit",
}

@Entity("fund_transactions")
@Index(["storeId", "occurredAt"])
@Index(["fundId", "occurredAt"])
@Index(["refType", "refId"])
export class FundTransaction extends BaseEntity {
  @Column({ type: "uuid" })
  @Index()
  storeId: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  fundId: string;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({ type: "varchar", length: 20 })
  refType: FundTransactionRefTypeEnum;

  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
