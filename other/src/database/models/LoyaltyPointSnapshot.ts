import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

/**
 * Loyalty Point Snapshot
 * Lưu trữ snapshot điểm tích lũy theo tháng để tăng tốc truy vấn
 */
@Entity("loyalty_point_snapshots")
export class LoyaltyPointSnapshot extends BaseEntity {
  @Column({ type: "timestamptz" })
  snapshotAt!: Date; // Thời điểm snapshot (thường đầu tháng)

  @Column({ type: "uuid" })
  partnerId!: string;

  @Column(BaseNumericColumnOptions)
  points!: number; // Số điểm tại thời điểm snapshot

  @Column(BaseNumericColumnOptions)
  totalRevenue!: number; // Tổng doanh số tại thời điểm snapshot
}
