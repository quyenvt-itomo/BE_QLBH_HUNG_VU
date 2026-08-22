import { Entity, Column } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import {
  BaseNullableNumericColumnOptions,
  BaseNumericColumnOptions,
} from "@/shared/base/BaseEntity";
import { ShiftStatusEnum, ChecklistKey } from "@/shared/constants/enum";

export type ShiftChecklistItem = Record<ChecklistKey, boolean>;

export type CashKey =
  | "500000"
  | "200000"
  | "100000"
  | "50000"
  | "20000"
  | "10000"
  | "5000"
  | "2000"
  | "1000";

@Entity("shifts")
export class Shift extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 50 })
  code: string;

  // vào ca
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  startAt: Date;
  @Column(BaseNumericColumnOptions)
  openingCash: number; // số tiền mặt khi vào ca (1)
  @Column({ type: "jsonb", nullable: true, default: null })
  openingCashSnapshot: Record<CashKey, number> | null; // snapshot số lượng tiền mặt theo mệnh giá khi vào ca, ví dụ { "100000": 2, "50000": 3 }

  @Column({ type: "jsonb", nullable: true, default: null })
  openingChecklist: ShiftChecklistItem | null;

  // ra ca
  @Column({ type: "timestamptz", nullable: true, default: null })
  endAt: Date | null;

  @Column({ type: "int", nullable: true, default: null })
  totalSaleOrder: number | null; // Tổng đơn hàng trong ca
  @Column({ type: "int", nullable: true, default: null })
  totalSaleReturnOrder: number | null; // Tổng đơn hoàn trả trong ca
  @Column({ type: "int", nullable: true, default: null })
  totalRevenue: number | null; // Tổng doanh thu trong ca, (đơn bán + đơn hoàn vì đơn hoàn thực chất vẫn tăng tiền)
  @Column(BaseNullableNumericColumnOptions)
  totalDebtAmount: number | null; // Tổng tiền khách chưa thanh toán trong ca

  @Column(BaseNullableNumericColumnOptions)
  totalCashInFromOrders: number | null; // tổng tiền mặt thu vào từ đơn hàng trong ca (2)
  @Column(BaseNullableNumericColumnOptions)
  totalCashIn: number | null; // tổng tiền mặt thu vào trong ca (không theo đơn hàng) (3)
  @Column(BaseNullableNumericColumnOptions)
  totalCashOut: number | null; // tổng tiền mặt chi ra trong ca (không theo đơn hàng hoặc theo đơn nhập hàng) (4)
  @Column(BaseNullableNumericColumnOptions)
  expectedCash: number | null; // số tiền mặt dự kiến phải có khi ra ca = (1 + 2 + 3 - 4)

  @Column(BaseNullableNumericColumnOptions)
  closingCash: number | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  closingCashSnapshot: Record<CashKey, number> | null; // snapshot số lượng tiền mặt theo mệnh giá khi ra ca

  @Column(BaseNullableNumericColumnOptions)
  difference: number | null; // = closingCash - expectedCash, nếu dương là thừa tiền, âm là thiếu tiền
  @Column({ type: "jsonb", nullable: true, default: null })
  closingChecklist: ShiftChecklistItem | null;

  @Column({ type: "varchar", length: 20, default: ShiftStatusEnum.ACTIVE })
  status: ShiftStatusEnum;
}
