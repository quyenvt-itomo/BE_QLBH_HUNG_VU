import { NotificationController } from "./notification.controller";
import { simpleRoutes } from "../_shared/simple.route";
export class NotificationRouter { constructor(private readonly controller: NotificationController) {} getRouter() { return simpleRoutes(this.controller, "report"); } }
