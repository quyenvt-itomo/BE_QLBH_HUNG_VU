import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { NotificationRepository } from "./notification.repository";
import { Notification } from "@/database/models/Notification";
import {
  NotificationRelations,
  NotificationSelectBasic,
} from "./notification.select";
import { SocketUtils } from "@/shared/utils/socket.utils";
import { getNotificationData } from "@/shared/utils/notification.utils";
import { ActionTypeEnum, NotificationTypeEnum } from "@/shared/constants/enum";
import logger from "@/shared/utils/logger";
import { NOTIFICATION_TYPES } from "./notification.types";

@injectable()
export class NotificationService extends BaseService<Notification> {
  protected repository: NotificationRepository;
  protected findOptions = {};
  protected relations = NotificationRelations;
  protected selectedFields = NotificationSelectBasic;
  constructor(
    @inject(NOTIFICATION_TYPES.NotificationRepository)
    repository: NotificationRepository,
  ) {
    super();
    this.repository = repository;
  }

  async createNotificationByEntity(
    data: any,
    type: NotificationTypeEnum,
    action: ActionTypeEnum,
    userIds: string[] = [],
  ): Promise<void> {
    try {
      const notificationData: Partial<Notification> = getNotificationData(
        data,
        type,
        action,
      );
      await this.createNotification(notificationData, userIds);
    } catch (error) {
      logger.error("Error creating notification by entity:", error);
    }
  }

  async createNotification(
    notificationData: Partial<Notification>,
    userIds: string[] = [],
  ): Promise<void> {
    try {
      if (userIds.length === 0) {
        return;
      }
      // Tạo notification trước
      const notification = await this.repository.create(notificationData);

      // Nếu có userIds, tạo userNotifications tương ứng
      const userNotificationData = userIds.map((userId) => ({
        userId,
        notificationId: notification.id,
        isRead: false,
      }));

      // Sử dụng TypeORM để tạo userNotifications
      await this.repository
        .getRepository()
        .manager.createQueryBuilder()
        .insert()
        .into("userNotifications")
        .values(userNotificationData)
        .execute();

      SocketUtils.sendSocketNotifications(
        userIds,
        "notification",
        notification,
      );
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  // Lấy notifications của user cụ thể
  async getUserNotifications(
    userId: string,
    page: number = 1,
    size: number = 20,
  ): Promise<any> {
    const offset = (page - 1) * size;

    const qb = this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .select(["n.*", 'un.isRead AS "isRead"'])
      .from("notifications", "n")
      .innerJoin("userNotifications", "un", "n.id = un.notificationId")
      .where("un.userId = :userId", { userId })
      .andWhere("n.deletedAt IS NULL")
      .orderBy("n.createdAt", "DESC")
      .limit(size)
      .offset(offset);

    const notifications = await qb.getRawMany();

    const countQb = this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .select("COUNT(*)", "total")
      .from("notifications", "n")
      .innerJoin("userNotifications", "un", "n.id = un.notificationId")
      .where("un.userId = :userId", { userId })
      .andWhere("n.deletedAt IS NULL");

    const { total } = await countQb.getRawOne();

    const unreadQb = this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .select("COUNT(*)", "totalUnread")
      .from("notifications", "n")
      .innerJoin("userNotifications", "un", "n.id = un.notificationId")
      .where("un.userId = :userId", { userId })
      .andWhere("n.deletedAt IS NULL")
      .andWhere("un.isRead = :isRead", { isRead: false });

    const { totalUnread } = await unreadQb.getRawOne();

    return {
      data: notifications,
      total: parseInt(total) || 0,
      page,
      size,
      totalPages: Math.ceil(parseInt(total) / size),
      totalUnread: parseInt(totalUnread) || 0,
    };
  }

  // Đánh dấu notification đã đọc
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update("userNotifications")
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("notificationId = :notificationId", { notificationId })
      .execute();
  }

  // Đánh dấu nhiều notifications đã đọc
  async markManyAsRead(
    userId: string,
    notificationIds: string[],
  ): Promise<void> {
    if (notificationIds.length === 0) return;

    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update("userNotifications")
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("notificationId IN (:...notificationIds)", { notificationIds })
      .execute();
  }

  // Đánh dấu tất cả notifications của user đã đọc
  async markAllAsRead(userId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update("userNotifications")
      .set({ isRead: true })
      .where("userId = :userId", { userId })
      .andWhere("isRead = :isRead", { isRead: false })
      .execute();
  }

  // Xóa notification
  async deleteNotification(notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update("notifications")
      .set({ deletedAt: new Date() })
      .where("id = :id", { id: notificationId })
      .execute();
  }

  // Khôi phục notification
  async restoreNotification(notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .update("notifications")
      .set({ deletedAt: null })
      .where("id = :id", { id: notificationId })
      .execute();
  }

  // Xóa vĩnh viễn notification
  async permanentDeleteNotification(notificationId: string): Promise<void> {
    await this.repository
      .getRepository()
      .manager.createQueryBuilder()
      .delete()
      .from("notifications")
      .where("id = :id", { id: notificationId })
      .execute();
  }
}
