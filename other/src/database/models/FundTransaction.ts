import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity } from "typeorm";
import {
  FundTransactionRefTypeEnum,
  FundTransactionType,
} from "@/shared/constants/enum";

@Entity("fund_transactions")
export class FundTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  fundId: string;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: FundTransactionType })
  type: FundTransactionType;

  @Column({ type: "enum", enum: FundTransactionRefTypeEnum })
  refType: FundTransactionRefTypeEnum;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
