import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import {
  DebtDirectionEnum,
  DebtRefTypeEnum,
  PartnerDebtSideEnum,
} from "@/shared/constants/enum";

@Entity("debt_transactions")
export class DebtTransaction extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "uuid" })
  partnerId: string;

  @Column({ type: "uuid" })
  storeId: string;

  @Column({ type: "enum", enum: PartnerDebtSideEnum })
  side: PartnerDebtSideEnum;

  @Column({ type: "enum", enum: DebtDirectionEnum })
  direction: DebtDirectionEnum;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: DebtRefTypeEnum })
  refType: DebtRefTypeEnum;
  @Column({ type: "uuid" })
  refId: string;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  refCode?: string | null;
}
