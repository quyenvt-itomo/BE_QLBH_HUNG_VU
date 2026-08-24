import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { PurchaseRequisition } from "./PurchaseRequisition";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Partner, PartnerSnapshot } from "./Partner";
import { PurchaseQuotation } from "./PurchaseQuotation";

export interface ReferralCodeLineSnapshot {
  productId: string;
  productCode: string;
  productName: string;
  unitId: string | null;
  unitName: string | null;
  quantity: number;
}

@Entity("referral_codes")
@Index("IDX_referral_codes_code", ["code"])
export class ReferralCode extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 100 })
  code: string;

  @Column({ type: "uuid" })
  purchaseRequisitionId: string;

  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null;

  @Column({ type: "boolean", default: false })
  isUsed: boolean;

  @Column({ type: "timestamptz", nullable: true, default: null })
  usedAt: Date | null;

  @Column({ type: "boolean", default: false })
  isLock: boolean; // Có một báo giá được gắn với mã giới thiệu này đã được duyệt, không cho phép tạo báo giá mới nữa

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  linesSnapshot: ReferralCodeLineSnapshot[];

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => PurchaseRequisition, (pr) => pr.referralCodes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "purchaseRequisitionId" })
  purchaseRequisition: PurchaseRequisition;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @OneToMany(() => PurchaseQuotation, (pq) => pq.referralCode)
  purchaseQuotations: PurchaseQuotation[];
}
