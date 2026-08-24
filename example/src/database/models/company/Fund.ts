import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { Column, Entity, OneToMany } from "typeorm";
import { FundAdjustment } from "./FundAdjustment";
import { BankAccount } from "@/shared/base/BaseValidator";
export enum FundTypeEnum {
  CASH = "cash",
  BANK = "bank",
}
export interface FundSnapshot {
  id: string;
  code: string;
  name: string;
  type: FundTypeEnum;
  bankAccount: BankAccount | null;
  isActive: boolean;
}

@Entity("funds")
export class Fund extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 25 })
  code: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "enum", enum: FundTypeEnum })
  type: FundTypeEnum;

  // TODO: THÔNG TIN NGÂN HÀNG
  @Column({ type: "jsonb", nullable: true, default: null })
  bankAccount: BankAccount | null;

  // Bật tắt thanh toán
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // * ======================== RELATIONS ========================= //
  @OneToMany(() => FundAdjustment, (fundAdjustment) => fundAdjustment.fund, {
    cascade: true,
  })
  fundAdjustments: FundAdjustment[];
}
