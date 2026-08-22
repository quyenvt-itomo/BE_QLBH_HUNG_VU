import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, Index } from "typeorm";

export enum OtpPurposeEnum {
  QUOTATION_CUSTOMER_APPROVE = "QUOTATION_CUSTOMER_APPROVE",
  LOGIN_VERIFY = "LOGIN_VERIFY",
  PASSWORD_RESET = "PASSWORD_RESET",
}

/**
 * OTP Token dùng cho xác thực khách hàng
 * - Khách hàng tự xác nhận báo giá qua email OTP
 * - Xác thực đăng nhập 2 lớp
 * - Reset mật khẩu
 */
@Entity("otp_tokens")
@Index(["refId", "purpose", "isUsed"])
@Index(["token", "expiredAt"])
export class OtpToken extends BaseEntity {
  /** Mã OTP (6 chữ số) */
  @Column({ type: "varchar", length: 10 })
  token: string;

  /** Mục đích sử dụng OTP */
  @Column({ type: "varchar", length: 50 })
  purpose: OtpPurposeEnum;

  /** ID của đối tượng liên quan (vd: quotationId, userId) */
  @Column({ type: "uuid" })
  refId: string;

  /** Email nhận OTP */
  @Column({ type: "varchar", length: 255 })
  sentToEmail: string;

  /** Thời điểm hết hạn (now() + 15 phút) */
  @Column({ type: "timestamptz" })
  expiredAt: Date;

  /** Đã sử dụng OTP này chưa */
  @Column({ type: "boolean", default: false })
  isUsed: boolean;

  /** Số lần thử sai */
  @Column({ type: "int", default: 0 })
  attemptCount: number;

  /** Khóa OTP sau quá nhiều lần thử sai */
  @Column({ type: "boolean", default: false })
  isLocked: boolean;
}
