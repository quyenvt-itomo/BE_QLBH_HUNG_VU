import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, Index } from "typeorm";
import { EmployeeSnapshot } from "./company/Employee";

export enum LoginApprovalStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export interface DeviceInfo {
  userAgent?: string | null;
  ip?: string | null;
  browser?: string | null;
  os?: string | null;
}

@Entity("login_approvals")
@Index(["userId", "deviceId"])
@Index(["companyId", "status"])
export class LoginApproval extends BaseEntity {
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  companyId: string;

  @Column({ type: "varchar", length: 255 })
  deviceId: string;

  @Column({ type: "jsonb", nullable: true, default: null })
  deviceInfo: DeviceInfo | null;

  @Column({
    type: "enum",
    enum: LoginApprovalStatusEnum,
    default: LoginApprovalStatusEnum.PENDING,
  })
  status: LoginApprovalStatusEnum;

  @Column({ type: "timestamptz" })
  expiresAt: Date;

  @Column({ type: "timestamptz", nullable: true, default: null })
  approvedAt: Date | null;

  @Column({ type: "uuid", nullable: true, default: null })
  approvedById: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  approverSnapshot: EmployeeSnapshot | null;
}
