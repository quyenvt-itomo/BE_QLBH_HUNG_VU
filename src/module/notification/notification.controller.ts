import { injectable, inject } from "inversify";
import { NotificationService } from "./notification.service";
import { NOTIFICATION_TYPES } from "./notification.types";
import { BaseController } from "@/shared/base/BaseController";
import { Notification } from "@/database/models/Notification";

@injectable()
export class NotificationController extends BaseController<Notification> {
  protected service: NotificationService;

  constructor(
    @inject(NOTIFICATION_TYPES.NotificationService)
    service: NotificationService,
  ) {
    super();
    this.service = service;
  }
}
