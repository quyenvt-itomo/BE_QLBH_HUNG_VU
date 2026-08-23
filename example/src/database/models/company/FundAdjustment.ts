import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Fund, FundSnapshot } from "./Fund";
import { TransactionType } from "@/shared/constants/enum";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";

@Entity("fund_adjustments")
export class FundAdjustment extends BaseEntityWithCompany {
  @Column({ type: "varchar" })
  code: string;

  @Column({ type: "timestamptz" })
  occurredAt: Date; // ngày ghi nhận điều chỉnh

  @Column({ type: "uuid", nullable: true, default: null })
  fundId: string | null; // quỹ tiền mặt bị điều chỉnh, dùng để liên kết với Fund và lấy thông tin quỹ khi cần thiết
  @Column({ type: "jsonb", nullable: true, default: null })
  fundSnapshot: FundSnapshot | null; // snapshot thông tin quỹ bị điều chỉnh, để tránh trường hợp thông tin quỹ bị thay đổi sau khi điều chỉnh ảnh hưởng đến báo cáo doanh thu theo quỹ

  @Column(BaseNumericColumnOptions)
  expectedAmount: number; // số tiền hệ thống ghi nhận

  @Column(BaseNumericColumnOptions)
  countedAmount: number; // số tiền thực tế kiểm kê

  @Column(BaseNumericColumnOptions)
  deltaAmount: number;

  @Column({
    type: "enum",
    enum: TransactionType,
    default: TransactionType.IN,
  })
  type: TransactionType;

  @Column({ type: "text", nullable: true, default: null })
  reason: string | null; // lý do điều chỉnh, do người dùng nhập vào để giải thích cho sự chênh lệch giữa số tiền hệ thống và số tiền thực tế

  @Column({ type: "boolean", default: false })
  isInitial: boolean; // là phiếu điều chỉnh quỹ đầu kỳ

  // * ======================== RELATIONS ========================= //
  @ManyToOne(() => Fund, (fund) => fund.fundAdjustments, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "fundId" })
  fund: Fund;
}
