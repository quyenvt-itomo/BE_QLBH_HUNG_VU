import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../User";
import { Role } from "./Role";
import { BaseEntityWithStore } from "./BaseEntityWithStore";

/**
 * Store Entity
 * Quản lý các không gian làm việc (workspace/store)
 * Mỗi store sẽ có một schema riêng trong PostgreSQL
 */
@Entity("store_users")
export class StoreUser extends BaseEntityWithStore {
  @Column({ type: "uuid" })
  userId: string;
  @Column({ type: "uuid", nullable: true, default: null })
  roleId: string | null;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => User, (user) => user.storeUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Role, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "roleId" })
  role: Role | null;
}
