import { ContainerModule } from "inversify";
import { NOTIFICATION_TYPES } from "./notification.types";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "./notification.repository";
import { NotificationRouter } from "./notification.route";

export const notificationModule = new ContainerModule((bind) => {
  bind<NotificationController>(NOTIFICATION_TYPES.NotificationController).to(
    NotificationController,
  );
  bind<NotificationService>(NOTIFICATION_TYPES.NotificationService).to(
    NotificationService,
  );
  bind<NotificationRepository>(NOTIFICATION_TYPES.NotificationRepository).to(
    NotificationRepository,
  );
  bind<NotificationRouter>(NOTIFICATION_TYPES.NotificationRouter).to(
    NotificationRouter,
  );
});
