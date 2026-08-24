import { Router } from "express";
import { inject, injectable } from "inversify";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  LoginSchema,
  SeenNotificationSchema,
  UpdateAuthSchema,
} from "./auth.validator";
import { AUTH_TYPES } from "./auth.types";
import { AuthController } from "./auth.controller";
import { BaseParamsSchema } from "@/shared/base/BaseValidator";

@injectable()
export class AuthRouter {
  private router = Router();
  constructor(@inject(AUTH_TYPES.AuthController) controller: AuthController) {
    this.router.get(
      "/notifications",
      authenticate,
      controller.getUserNotifications,
    );
    this.router.post(
      "/notifications/:id/mark-as-read",
      authenticate,
      zodValidate(BaseParamsSchema, "params"),
      controller.seenUserNotification,
    );
    this.router.post(
      "/notifications",
      authenticate,
      zodValidate(SeenNotificationSchema, "body"),
      controller.seenUserNotifications,
    );
    this.router.post(
      "/notifications/all",
      authenticate,
      controller.seenAllUserNotification,
    );

    this.router.post(
      "/login",
      zodValidate(LoginSchema, "body"),
      controller.login,
    );
    this.router.post("/logout", authenticate, controller.logout);
    this.router.get("/me", authenticate, controller.current);
    this.router.put(
      "/me",
      authenticate,
      zodValidate(UpdateAuthSchema, "body"),
      controller.update,
    );
    this.router.put(
      "/change-password",
      authenticate,
      controller.changePassword,
    );
  }
  getRouter(): Router {
    return this.router;
  }
}
