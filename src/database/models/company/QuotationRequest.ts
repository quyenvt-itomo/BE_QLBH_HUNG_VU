import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { QuotationRequestLine } from "./QuotationRequestLine";
import { ApproveStatus } from "@/shared/constants/enum";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Partner, PartnerSnapshot } from "./Partner";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";

@Entity("quotation_requests")
export class QuotationRequest extends BaseEntityWithCompany {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Người phụ trách
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // Khách hàng
  @Column({ type: "uuid", nullable: true, default: null })
  customerId: string | null;
  // Được sinh ra trước khi có partner (hoặc nếu tìm được đơn vị trùng mã số thuế thì gắn cùng luôn)
  // Ban đầu chưa có, khi phê duyệt thì có option là có tạo mới partner luôn hay không
  // ? nếu có thì sẽ gắn customerId vào partner mới tạo
  // ? nếu không thì để null và chỉ lưu snapshot thông tin nhà cung cấp vào quotation
  @Column({ type: "jsonb", nullable: true, default: null })
  customerSnapshot: PartnerSnapshot | null;

  // Người đề nghị
  @Column({ type: "uuid", nullable: true, default: null })
  requesterId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  requesterSnapshot: PartnerContactSnapshot | null;

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

  @Column({ type: "boolean", default: false })
  isLock: boolean; // Có một báo giá được gắn với mã giới thiệu này đã được duyệt, không cho phép tạo báo giá mới nữa

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Partner, { onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" })
  customer: Partner | null;

  @ManyToOne(() => PartnerContact, { onDelete: "SET NULL" })
  @JoinColumn({ name: "requesterId" })
  requester: PartnerContact | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @OneToMany(() => QuotationRequestLine, (line) => line.quotationRequest, {
    cascade: true,
  })
  lines: QuotationRequestLine[];
}
