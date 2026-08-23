import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../User";
import { StoreEntity } from "./StoreEntity";

/**
 * Store Entity
 * Quản lý các không gian làm việc (workspace/store)
 * Mỗi store sẽ có một schema riêng trong PostgreSQL
 */
@Entity("store_users")
export class StoreUser extends StoreEntity {
  @Column({ type: "uuid" })
  userId: string;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => User, (user) => user.storeUsers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;
}
