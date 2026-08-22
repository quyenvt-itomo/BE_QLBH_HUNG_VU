import { ActionType, NotificationType } from "@/database/models/Notification";
import {
  notificationContent,
  NotificationTitleMap,
} from "../constants/notification";
import logger from "./logger";

export const getNotificationData = (
  data: any,
  type: NotificationType,
  action: ActionType,
) => {
  try {
    return {
      title: NotificationTitleMap[type]?.[action] || "Thông báo hệ thống",
      body: getNotificationContent(type, action),
      data: {
        highlightValues: getHighlightValues(type, data),
        ...data,
      },
      entityId: data?.id || null,
      entityType: data?.entityType || null,
      type,
      action,
    };
  } catch (error) {
    logger.error("Error generating notification data:", error);
    throw error;
  }
};

function getHighlightValues(type: NotificationType, data: any) {
  switch (type) {
    case NotificationType.ORDER_LINE:
      return { sku: data?.sku, code: data?.code };
    case NotificationType.PRODUCTION:
      return { code: data?.code, remainingDays: Math.abs(data?.remainingDays) };
    case NotificationType.ORDER:
      return {
        poCode: data?.poCode,
        remainingDays: Math.abs(data?.remainingDays),
      };
    default:
      return { code: data?.code };
  }
}

const getNotificationContent = (
  type: NotificationType,
  action: ActionType,
): string => {
  return notificationContent[`${type}.${action}`] || "";
};
