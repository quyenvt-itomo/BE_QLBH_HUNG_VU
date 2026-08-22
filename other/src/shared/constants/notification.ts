import { ActionTypeEnum, NotificationTypeEnum } from "./enum";

type NotificationContentKey = `${NotificationTypeEnum}.${ActionTypeEnum}`;

type NotificationContent = {
  [key in NotificationContentKey]?: string;
};

export const NotificationTitleMap: Record<
  NotificationTypeEnum,
  Partial<Record<ActionTypeEnum, string>>
> = {};

export const notificationContent: NotificationContent = {};
