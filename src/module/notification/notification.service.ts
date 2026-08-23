import { Notification } from "@/database/models/Notification";
import { SimpleService } from "../_shared/simple.service";
import { NotificationRepository } from "./notification.repository";
export class NotificationService extends SimpleService<Notification> { constructor(repository: NotificationRepository) { super(repository, "store"); } async validateBeforeCreate(): Promise<void> { throw new Error("notification.generated_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("notification.immutable"); } async validateBeforeDelete(): Promise<void> { throw new Error("notification.immutable"); } }
