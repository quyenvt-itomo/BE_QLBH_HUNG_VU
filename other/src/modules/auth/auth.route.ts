import { Router } from "express";
import { injectable, inject } from "inversify";
import { AuthController } from "./auth.controller";

import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  LoginSchema,
  SeenNotificationSchema,
  UpdateInfoSchema,
  VerifyOtpSchema,
} from "./auth.validator";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { AUTH_TYPES } from "./auth.types";

@injectable()
export class AuthRouter {
  private router: Router;

  constructor(
    @inject(AUTH_TYPES.AuthController)
    private authController: AuthController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.post(
      "/login",
      zodValidate(LoginSchema, "body"),
      this.authController.login,
    );

    this.router.post(
      "/verify-otp",
      zodValidate(VerifyOtpSchema, "body"),
      this.authController.verifyOtp,
    );

    // Protected routes
    this.router.post("/logout", authenticate, this.authController.logout);
    this.router.get("/me", authenticate, this.authController.getCurrentUser);
    this.router.put(
      "/update-info",
      authenticate,
      zodValidate(UpdateInfoSchema, "body"),
      this.authController.updateInfo,
    );
    this.router.get(
      "/notifications",
      authenticate,
      this.authController.getUserNotifications,
    );
    this.router.put(
      "/notifications",
      authenticate,
      zodValidate(SeenNotificationSchema, "body"),
      this.authController.seenUserNotification,
    );
    this.router.put(
      "/notifications/all",
      authenticate,
      this.authController.seenAllUserNotification,
    );
    this.router.put(
      "/change-password",
      authenticate,
      this.authController.changePassword,
    );
    this.router.get("/shifts", authenticate, this.authController.getMyShifts);
  }

  public getRouter(): Router {
    return this.router;
  }
}
