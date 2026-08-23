import { Notification } from "@/database/models/Notification";
import { SimpleRepository } from "../_shared/simple.repository";
export class NotificationRepository extends SimpleRepository<Notification> { constructor() { super(Notification); } }
