import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { PurchaseRequisitionLine } from "./PurchaseRequisitionLine";
import { ApproveStatus } from "@/shared/constants/enum";
import { Employee, EmployeeSnapshot } from "./Employee";
import { Organization, OrganizationSnapshot } from "../Organization";
import { Order, OrderSnapshot } from "./Order";
import { Production, ProductionSnapshot } from "./Production";
import { ReferralCode } from "./ReferralCode";

@Entity("purchase_requisitions")
export class PurchaseRequisition extends BaseEntityWithCompany {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Bộ phận đề nghị
  @Column({ type: "uuid", nullable: true, default: null })
  departmentId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  departmentSnapshot: OrganizationSnapshot | null;

  // Người đề nghị
  @Column({ type: "uuid", nullable: true, default: null })
  requesterId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  requesterSnapshot: EmployeeSnapshot | null;

  // Mua theo đơn hàng
  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null; // Không lưu snapshot chi tiết, chỉ cần id và code của đơn hàng là đủ

  // Mua theo lệnh sản xuất
  @Column({ type: "uuid", nullable: true, default: null })
  productionId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  productionSnapshot: ProductionSnapshot | null; // Không lưu snapshot chi tiết, chỉ cần id và code của lệnh sản xuất là đủ

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
  @ManyToOne(() => Organization, { onDelete: "SET NULL" })
  @JoinColumn({ name: "departmentId" })
  department: Organization | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "requesterId" })
  requester: Employee | null;

  @ManyToOne(() => Order, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @ManyToOne(() => Production, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productionId" })
  production: Production | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "approverId" })
  approver: Employee | null;

  @OneToMany(
    () => PurchaseRequisitionLine,
    (line) => line.purchaseRequisition,
    { cascade: true },
  )
  lines: PurchaseRequisitionLine[];

  // Mã giới thiệu được tạo ra từ đề nghị mua vật tư này
  @OneToMany(() => ReferralCode, (ref) => ref.purchaseRequisition)
  referralCodes: ReferralCode[];
}
