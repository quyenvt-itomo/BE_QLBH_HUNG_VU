import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { PurchaseLine } from "./PurchaseLine";
import { DiscountTypeEnum, ApproveStatus } from "@/shared/constants/enum";
import { Partner, PartnerSnapshot } from "./Partner";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";
import { AdditionalInfo } from "@/shared/base/BaseValidator";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Invoice } from "./Invoice";

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
}

export interface PurchaseSnapshot {
  id: string;
  code: string;
  orderedAt: Date;
  supplierId: string | null;
  supplierSnapshot: PartnerSnapshot | null;
  sellerId: string | null;
  sellerSnapshot: PartnerContactSnapshot | null;
  staffId: string | null;
  staffSnapshot: EmployeeSnapshot | null;
  toleranceRate: number;

  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  totalCommissionAmount: number;
}

@Entity("purchases")
export class Purchase extends BaseEntityWithCompany {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  orderedAt: Date; // Ngày đặt hàng
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "uuid", nullable: true, default: null })
  supplierId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  supplierSnapshot: PartnerSnapshot | null;

  // Người bán hàng cho mình (Người liên hệ của công ty đối tác)
  @Column({ type: "uuid", nullable: true, default: null })
  sellerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  sellerSnapshot: PartnerContactSnapshot | null;

  // Người phụ trách
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // Hình thức thanh toán (tiền mặt, chuyển khoản, tín dụng...)
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  paymentMethod: PaymentMethod | null;

  @Column(BaseNumericColumnOptions)
  toleranceRate: number; // Tỷ lệ dung sai

  @Column({
    type: "enum",
    enum: DiscountTypeEnum,
    default: DiscountTypeEnum.AMOUNT,
  })
  discountType: DiscountTypeEnum; // AMOUNT | PERCENT
  @Column(BaseNumericColumnOptions)
  discountValue: number; // % hoặc số tiền, tuỳ discountType

  @Column(BaseNumericColumnOptions)
  subTotal: number; // Tổng tiền trước thuế và chiết khấu
  @Column(BaseNumericColumnOptions)
  taxAmount: number; // Số tiền thuế của toàn bộ đơn hàng (tổng của tất cả dòng)
  @Column(BaseNumericColumnOptions)
  totalAmount: number; // Số tiền cuối cùng phải trả (subTotal + taxAmount)

  @Column(BaseNumericColumnOptions)
  totalCommissionAmount: number; // Tổng tiền hoa hồng phải trả cho người bán hàng (tổng của tất cả dòng)

  // Hoa hồng thực tế khi đơn hàng hoàn thành = tổng của tất cả actualCommissionAmount của các dòng
  @Column(BaseNumericColumnOptions)
  totalActualCommissionAmount: number;

  // TODO: Thông tin thêm
  @Column({ type: "jsonb", default: () => "'[]'" })
  additionalInfo: AdditionalInfo[];

  @Column({ type: "timestamptz", nullable: true, default: null })
  approvedAt: Date | null; // Có thể là từ chối hoặc duyệt nhưng đều ghi lại thời điểm xử lý cuối cùng
  @Column({ type: "varchar", length: 50, default: ApproveStatus.PENDING })
  approveStatus: ApproveStatus;
  @Column({ type: "uuid", nullable: true, default: null })
  approverId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  approverSnapshot: EmployeeSnapshot | null;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  rejectReason: string | null; // Nếu bị từ chối thì lưu lý do

  // Đã hoàn thành chưa
  @Column({ type: "boolean", default: false })
  isCompleted: boolean;
  // Hoàn thành khi nào
  @Column({ type: "timestamptz", nullable: true, default: null })
  completedAt: Date | null;

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "supplierId" })
  supplier: Partner | null;

  @ManyToOne(() => PartnerContact, { onDelete: "SET NULL" })
  @JoinColumn({ name: "sellerId" })
  seller: PartnerContact | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @OneToMany(() => PurchaseLine, (line) => line.purchase, {
    cascade: true,
  })
  lines: PurchaseLine[];

  @OneToMany(() => Invoice, (invoice) => invoice.purchase)
  invoices: Invoice[];
}
