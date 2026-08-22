import dayjs from "dayjs";
import { ActionTypeEnum, NotificationTypeEnum } from "../constants/enum";
import {
  notificationContent,
  NotificationTitleMap,
} from "../constants/notification";
import logger from "./logger";

export const getNotificationData = (
  data: any,
  type: NotificationTypeEnum,
  action: ActionTypeEnum
) => {
  try {
    const highlightValueMap: any = {};

    let content =
      getNotificationContent(type, action) +
      (data?.plannedEndDate ? " Hạn hoàn thành: ${}" : "");

    return {
      title: NotificationTitleMap[type][action],
      content,
      metadata: {
        highlightValues:
          highlightValueMap[type]?.[action] || highlightValueMap[type] || [],
        featureId: data?.feature?.id,
        projectId: data?.feature?.projectId,
      },
      oId: data?.id || null,
      projectId:
        data?.projectId || data?.feature?.project?.id || data?.id || null,
      type,
      action,
    };
  } catch (error) {
    logger.error("Error generating notification data:", error);
    throw error;
  }
};

const getNotificationContent = (
  type: NotificationTypeEnum,
  action: ActionTypeEnum
): string => {
  return notificationContent[`${type}.${action}`] || "";
};
