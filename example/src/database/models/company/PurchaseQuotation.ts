import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { PurchaseQuotationLine } from "./PurchaseQuotationLine";
import { Employee, EmployeeSnapshot } from "./Employee";
import { ApproveStatus } from "@/shared/constants/enum";
import { Partner, PartnerSnapshot } from "./Partner";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { ReferralCode } from "./ReferralCode";

export enum PurchaseQuotationType {
  // Báo giá / Chào giá (Báo giá là có mã giới thiệu, chào giá là không có mã giới thiệu)
  OFFER = "offer", // Chào giá
  QUOTATION = "quotation", // Báo giá
}

@Entity("purchase_quotations")
export class PurchaseQuotation extends BaseEntityWithStore {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({
    type: "varchar",
    length: 50,
    default: PurchaseQuotationType.OFFER,
  })
  type: PurchaseQuotationType;

  // Người phụ trách
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // Nhà cung cấp
  @Column({ type: "uuid", nullable: true, default: null })
  supplierId: string | null;
  // Được sinh ra trước khi có partner (hoặc nếu tìm được đơn vị trùng mã số thuế thì gắn cùng luôn)
  // Ban đầu chưa có, khi phê duyệt thì có option là có tạo mới partner luôn hay không
  // ? nếu có thì sẽ gắn supplierId vào partner mới tạo
  // ? nếu không thì để null và chỉ lưu snapshot thông tin nhà cung cấp vào quotation
  @Column({ type: "jsonb", nullable: true, default: null })
  supplierSnapshot: PartnerSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  referralCodeId: string | null;

  // Người báo giá
  @Column({ type: "uuid", nullable: true, default: null })
  quoterId: string | null;
  // Tương tự partner, tìm theo số điện thoại
  @Column({ type: "jsonb", nullable: true, default: null })
  quoterSnapshot: PartnerContactSnapshot | null;

  @Column(BaseNumericColumnOptions)
  subTotal: number; // Tổng tiền trước thuế và chiết khấu
  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Số tiền thuế
  @Column(BaseNumericColumnOptions)
  totalAmount: number; // Số tiền cuối cùng phải trả (subTotal + taxAmount)

  @Column({ type: "timestamptz", nullable: true, default: null })
  approvedAt: Date | null; // Có thể là từ chối hoặc duyệt nhưng đều ghi lại thời điểm xử lý cuối cùng
  @Column({
    type: "varchar",
    length: 50,
    default: ApproveStatus.PENDING,
  })
  approveStatus: ApproveStatus;
  @Column({ type: "uuid", nullable: true, default: null })
  approverId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  approverSnapshot: EmployeeSnapshot | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  rejectReason: string | null; // Nếu bị từ chối thì lưu lý do

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "supplierId" })
  supplier: Partner | null;

  @ManyToOne(() => PartnerContact, { onDelete: "SET NULL" })
  @JoinColumn({ name: "quoterId" })
  quoter: PartnerContact | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @ManyToOne(() => ReferralCode, (rc) => rc.purchaseQuotations, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "referralCodeId" })
  referralCode: ReferralCode | null;

  @OneToMany(() => PurchaseQuotationLine, (line) => line.purchaseQuotation, {
    cascade: true,
  })
  lines: PurchaseQuotationLine[];
}
