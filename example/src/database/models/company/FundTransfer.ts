import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Fund, FundSnapshot } from "./Fund";
import { BaseEntityWithStore } from "./BaseEntityWithStore";

@Entity("fund_transfers")
export class FundTransfer extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 20 })
  code: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date;

  @Column({ type: "text", nullable: true, default: null })
  reason: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  fromFundId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fromFundSnapshot: FundSnapshot | null; // snapshot thông tin quỹ chuyển đi, để tránh trường hợp thông tin quỹ bị thay đổi sau khi chuyển tiền

  @Column({ type: "uuid", nullable: true, default: null })
  toFundId: string;
  @Column({ type: "jsonb", nullable: true, default: null })
  toFundSnapshot: FundSnapshot | null; // snapshot thông tin quỹ chuyển đến, để tránh trường hợp thông tin quỹ bị thay đổi sau khi chuyển tiền

  @Column(BaseNumericColumnOptions)
  amount: number;

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Fund, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fromFundId" })
  fromFund: Fund | null;

  @ManyToOne(() => Fund, { onDelete: "SET NULL" })
  @JoinColumn({ name: "toFundId" })
  toFund: Fund | null;
}
