import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

@Entity("vat_debt_snapshots")
export class VatDebtSnapshot extends BaseEntity {
  @Column({ type: "timestamptz" })
  snapshotAt!: Date;

  @Column({ type: "uuid" })
  storeId!: string;

  @Column(BaseNumericColumnOptions)
  amount!: number;
}
