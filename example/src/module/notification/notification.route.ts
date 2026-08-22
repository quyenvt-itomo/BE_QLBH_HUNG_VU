import { Router } from "express";
import { injectable, inject } from "inversify";
import { NotificationController } from "./notification.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  NotificationParamsSchema,
} from "./notification.validator";
import { NOTIFICATION_TYPES } from "./notification.types";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { injectRequestContext } from "@/shared/middleware/requestContext.middleware";

@injectable()
export class NotificationRouter {
  private router: Router;

  constructor(
    @inject(NOTIFICATION_TYPES.NotificationController)
    private controller: NotificationController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authenticate, injectRequestContext);

    this.router.get(
      "/",
      zodValidate(NotificationQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateNotificationSchema, "body"),
      this.controller.create,
    );

    this.router.get(
      "/:id",
      zodValidate(NotificationParamsSchema, "params"),
      this.controller.getById,
    );

    this.router.put(
      "/:id",
      zodValidate(NotificationParamsSchema, "params"),
      zodValidate(UpdateNotificationSchema, "body"),
      this.controller.update,
    );

    this.router.delete(
      "/:id",
      zodValidate(NotificationParamsSchema, "params"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
