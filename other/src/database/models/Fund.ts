import { BaseEntityWithStore } from "./store/BaseEntityWithStore";
import { Column, Entity, OneToMany } from "typeorm";
import { FundTypeEnum } from "@/shared/constants/enum";
import { FundAdjustment } from "./FundAdjustment";

@Entity("funds")
export class Fund extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 25 })
  code: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "enum", enum: FundTypeEnum })
  type: FundTypeEnum;

  @Column({ type: "varchar", length: 255, nullable: true })
  bank: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  accountNumber: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  accountHolderName: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  branch: string | null;

  // * ======================== RELATIONS ========================= //
  @OneToMany(() => FundAdjustment, (fundAdjustment) => fundAdjustment.fund, {
    cascade: true,
  })
  fundAdjustments: FundAdjustment[];
}
