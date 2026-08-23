import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

@Entity("fund_snapshots")
export class FundSnapshot extends BaseEntity {
  @Column({ type: "timestamptz" })
  snapshotAt: Date;

  @Column({ type: "uuid" })
  fundId: string;

  @Column(BaseNumericColumnOptions)
  amount: number;
}
