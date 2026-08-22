import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
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
  storeId: string | null;
}

@Entity("funds")
export class Fund extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 25 })
  code: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "enum", enum: FundTypeEnum })
  type: FundTypeEnum;

  /** null = quỹ toàn hệ thống; có giá trị = quỹ riêng của chi nhánh. */
  @Column({ type: "uuid", nullable: true, default: null })
  storeId: string | null;

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
