import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { PaymentRequestLine } from "./PaymentRequestLine";
import { ApproveStatus } from "@/shared/constants/enum";
import { Partner, PartnerSnapshot } from "./Partner";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";
import { Employee, EmployeeSnapshot } from "./Employee";
import { FundTypeEnum } from "./Fund";

export enum PaymentRequestTypeEnum {
  INVOICE = "invoice", // Đề nghị thanh toán cho hóa đơn mua hàng
  COMMISSION = "commission", // Đề nghị thanh toán hoa hồng cho người liên hệ
}

export interface PaymentRequestSnapshot {
  id: string;
  timeAt: Date;
  code: string;
  type: PaymentRequestTypeEnum;
  staffId: string | null;
  staffSnapshot: EmployeeSnapshot | null;
  partnerId: string | null;
  partnerSnapshot: PartnerSnapshot | null;
  partnerContactId: string | null;
  partnerContactSnapshot: PartnerContactSnapshot | null;
  paymentMethod: FundTypeEnum | null;
  totalAmount: number;
}

@Entity("payment_requests")
export class PaymentRequest extends BaseEntityWithCompany {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date; // Ngày đề nghị
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 20 })
  type: PaymentRequestTypeEnum;

  // Người phụ trách / Người đề nghị
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  partnerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerSnapshot: PartnerSnapshot | null;

  // Người bán hàng cho mình (Người liên hệ của công ty đối tác)
  @Column({ type: "uuid", nullable: true, default: null })
  partnerContactId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerContactSnapshot: PartnerContactSnapshot | null;

  // Hình thức thanh toán (tiền mặt, chuyển khoản, tín dụng...)
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  paymentMethod: FundTypeEnum | null;

  @Column(BaseNumericColumnOptions)
  totalAmount: number; // Số tiền cuối cùng phải trả (subTotal + taxAmount)

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

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerId" })
  partner: Partner | null;

  @ManyToOne(() => PartnerContact, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerContactId" })
  partnerContact: PartnerContact | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @OneToMany(() => PaymentRequestLine, (line) => line.paymentRequest, {
    cascade: true,
  })
  lines: PaymentRequestLine[];
}
