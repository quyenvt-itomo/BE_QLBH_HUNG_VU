import { BaseEntity } from "@/shared/base/BaseEntity";
import { VerifyOtpTypeEnum } from "@/shared/constants/enum";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("verify_otps")
export class VerifyOtp extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 15, nullable: true, default: null })
  phone: string | null;

  @Column({ type: "enum", enum: VerifyOtpTypeEnum })
  type: VerifyOtpTypeEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  userId: string | null;

  @Column({ type: "varchar", length: 10 })
  otp: string;

  @Column({ type: "boolean", default: false })
  isUsed: boolean;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null;
}
