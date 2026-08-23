import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { ActionTypeEnum, NotificationTypeEnum } from "@/shared/constants/enum";
import { UserNotification } from "./UserNotification";

// Notification entity for system, club, friend, and tournament notifications
@Entity("notifications")
export class Notification extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "int", nullable: true, default: null })
  oId: number | null;

  @Column({ type: "varchar", enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @Column({
    type: "varchar",
    enum: ActionTypeEnum,
    nullable: true,
    default: null,
  })
  action: ActionTypeEnum | null;

  @Column({ type: "jsonb", nullable: true })
  metadata?: any;

  @OneToMany(
    () => UserNotification,
    (notification) => notification.notification,
  )
  userNotifications?: UserNotification[];
}
