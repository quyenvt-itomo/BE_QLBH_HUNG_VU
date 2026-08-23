import { Notification } from "@/database/models/Notification";
import { SimpleController } from "../_shared/simple.controller";
import { NotificationService } from "./notification.service";
export class NotificationController extends SimpleController<Notification> { constructor(service: NotificationService) { super(service); } }
