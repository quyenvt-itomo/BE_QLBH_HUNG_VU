import { z } from "zod";
import { BaseQuerySchema, BaseParamsSchema } from "@/shared/base/BaseValidator";
import { NotificationType } from "@/database/models/Notification";

export const NotificationQuerySchema = BaseQuerySchema.extend({
  type: z.enum(NotificationType).optional(),
  isRead: z.enum(["true", "false"]).optional(),
  userId: z.uuid().optional(),
  entityType: z.string().optional(),
});

export const CreateNotificationSchema = z.object({
  userId: z.uuid("Mã người dùng không hợp lệ"),
  type: z.enum(NotificationType),
  title: z.string().min(1, "Tiêu đề không được để trống").max(255),
  body: z.string().min(1, "Nội dung không được để trống"),
  data: z.record(z.string(), z.unknown()).nullish(),
  isRead: z.boolean().optional().default(false),
  readAt: z.coerce.date().nullish(),
  entityType: z.string().max(100).nullish(),
  entityId: z.uuid().nullish(),
});

export const UpdateNotificationSchema = CreateNotificationSchema.partial();

export const NotificationParamsSchema = BaseParamsSchema;

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotificationDto = z.infer<typeof UpdateNotificationSchema>;
