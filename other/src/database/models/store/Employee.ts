import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { EmployeeStatusEnum, GenderEnum } from "@/shared/constants/enum";
import { Attribute } from "../Attribute";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { IAddress } from "@/shared/base/BaseValidator";

// ============================== ATTRIBUTE ENTITIES ==============================
@Entity("employees")
export class Employee extends BaseEntityWithStore {
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 15, nullable: true, default: null })
  phone: string | null;
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  identityNumber: string | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  dob: Date | null;
  @Column({ type: "enum", enum: GenderEnum, nullable: true, default: null })
  gender: GenderEnum | null;
  @Column({ type: "jsonb", default: {} })
  address: IAddress | null;

  @Column({ type: "uuid", nullable: true, default: null })
  positionId: string | null;

  @Column({
    type: "enum",
    enum: EmployeeStatusEnum,
    default: EmployeeStatusEnum.ACTIVE,
  })
  status: EmployeeStatusEnum;
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "timestamptz", nullable: true, default: null })
  hiredAt: Date | null; // Ngày tuyển dụng
  @Column({ type: "timestamptz", nullable: true, default: null })
  terminateAt: Date | null; // Ngày nghỉ việc

  // ============================= RELATION ENTITIES ==============================
  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "positionId" })
  position?: Attribute | null;
}
