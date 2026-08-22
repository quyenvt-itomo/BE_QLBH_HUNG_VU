import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { QuotationLine } from "./QuotationLine";
import { ApproveStatus, CommissionMode } from "@/shared/constants/enum";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Partner, PartnerSnapshot } from "./Partner";
import { QuotationRequest } from "./QuotationRequest";
import { AdditionalInfo } from "@/shared/base/BaseValidator";
import { QuotationCommission } from "./QuotationCommission";
import { MeshSpec, MeshSpecSnapshot } from "./MeshSpec";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

@Entity("quotations")
export class Quotation extends BaseEntityWithCompany {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  commissionMode: CommissionMode | null;

  // Có hiệu lực đến
  // Đến thời điểm này tự động chuyển sang trạng thái từ chối hoặc khách hàng từ chối
  // Lý do từ chối mặc định là "Hết hạn hiệu lực"
  @Column({ type: "timestamptz", nullable: true, default: null })
  validUntil: Date | null;

  // Gắn với yêu cầu báo giá
  @Column({ type: "uuid", nullable: true, default: null })
  quotationRequestId: string | null;

  // Khách hàng
  @Column({ type: "uuid", nullable: true, default: null })
  customerId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  customerSnapshot: PartnerSnapshot | null;

  // Người phụ trách
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  meshSpecId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  meshSpecSnapshot: MeshSpecSnapshot | null;

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

  // =====================================================
  // CUSTOMER APPROVAL (Khách hàng duyệt báo giá)
  // =====================================================
  @Column({ type: "varchar", length: 50, default: ApproveStatus.PENDING })
  customerApproveStatus: ApproveStatus;

  @Column({ type: "timestamptz", nullable: true, default: null })
  customerApprovedAt: Date | null;

  @Column({ type: "uuid", nullable: true, default: null })
  customerApproverId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  customerApproverSnapshot: EmployeeSnapshot | null;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  customerRejectReason: string | null;

  // =====================================================
  // SỐ LIỆU TỔNG HỢP (Aggregate — tránh tính lại khi hiển thị danh sách)
  // =====================================================
  @Column(BaseNumericColumnOptions)
  subTotal: number;

  @Column(BaseNumericColumnOptions)
  taxAmount: number;

  @Column(BaseNumericColumnOptions)
  totalAmount: number;

  @Column(BaseNumericColumnOptions)
  totalCommissionAmount: number;

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => QuotationRequest, { onDelete: "SET NULL" })
  @JoinColumn({ name: "quotationRequestId" })
  quotationRequest: QuotationRequest | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" })
  customer: Partner | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => MeshSpec, { onDelete: "SET NULL" })
  @JoinColumn({ name: "meshSpecId" })
  meshSpec: MeshSpec | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "customerApproverId" })
  customerApprover: Employee | null;

  @OneToMany(() => QuotationLine, (line) => line.quotation, {
    cascade: true,
  })
  lines: QuotationLine[];

  @OneToMany(() => QuotationCommission, (commission) => commission.quotation, {
    cascade: true,
  })
  commissions: QuotationCommission[];
}
