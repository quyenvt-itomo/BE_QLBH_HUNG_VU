import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { PartnerDebtSideEnum } from "@/shared/constants/enum";

@Entity("partner_debt_snapshots")
export class PartnerDebtSnapshot extends BaseEntity {
  @Column({ type: "timestamptz" })
  snapshotAt!: Date;

  @Column({ type: "uuid" })
  partnerId!: string;

  @Column({ type: "uuid" })
  storeId!: string;

  @Column({ type: "enum", enum: PartnerDebtSideEnum })
  side!: PartnerDebtSideEnum;

  @Column(BaseNumericColumnOptions)
  amount!: number;
}
