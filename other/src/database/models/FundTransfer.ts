import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Fund } from "./Fund";

@Entity("fund_transfers")
export class FundTransfer extends BaseEntity {
  @Column({ type: "varchar", length: 20 })
  code!: string;

  @Column({ type: "timestamptz" })
  occurredAt!: Date;

  @Column({ type: "uuid" })
  fromFundId: string;

  @Column({ type: "uuid" })
  toFundId: string;

  @Column(BaseNumericColumnOptions)
  amount!: number;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Fund, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "fromFundId" })
  fromFund!: Fund;

  @ManyToOne(() => Fund, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "toFundId" })
  toFund!: Fund;
}
