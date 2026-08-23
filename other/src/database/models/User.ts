import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { UserNotification } from "./UserNotification";
import { Gender } from "@/shared/constants/enum";
import { StoreUser } from "./store/StoreUser";
import { IAddress } from "@/shared/base/BaseValidator";
import { SystemRole } from "./SystemRole";
import { Employee } from "./store/Employee";

// ============================== USER ENTITIES ==============================
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 100 })
  username: string;
  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    default: null,
  })
  phone: string | null;
  @Column({ type: "enum", enum: Gender, nullable: true, default: null })
  gender: Gender | null;
  @Column({ type: "timestamptz", nullable: true, default: null })
  dob: Date | null;
  @Column({ type: "jsonb", default: {} })
  address: IAddress | null;

  @Column({ type: "uuid", nullable: true, default: null })
  systemRoleId: string | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "uuid", nullable: true, default: null })
  employeeId: string | null;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => SystemRole, {
    onDelete: "SET NULL",
  })
  systemRole?: SystemRole | null;

  @ManyToOne(() => Employee, {
    onDelete: "SET NULL",
  })
  employee?: Employee | null;

  @OneToMany(() => UserNotification, (notification) => notification.user)
  userNotifications?: UserNotification[];

  @OneToMany(() => StoreUser, (storeUser) => storeUser.user, {
    cascade: true,
  })
  storeUsers?: StoreUser[];
}
