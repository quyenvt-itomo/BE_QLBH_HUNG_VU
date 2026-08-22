import { Router } from "express";
import { injectable, inject } from "inversify";
import { AuthController } from "./auth.controller";

import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  LoginSchema,
  SeenNotificationSchema,
  UpdateAuthSchema,
} from "./auth.validator";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { AUTH_TYPES } from "./auth.types";
import { companyResolver } from "@/shared/middleware/company.middleware";
import { BaseParamsSchema } from "@/shared/base/BaseValidator";

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
    this.router.get(
      "/notifications",
      authenticate,
      companyResolver,
      this.authController.getUserNotifications,
    );
    this.router.post(
      "/notifications/:id/mark-as-read",
      authenticate,
      zodValidate(BaseParamsSchema, "params"),
      this.authController.seenUserNotification,
    );
    this.router.post(
      "/notifications",
      authenticate,
      zodValidate(SeenNotificationSchema, "body"),
      this.authController.seenUserNotifications,
    );
    this.router.post(
      "/notifications/all",
      authenticate,
      this.authController.seenAllUserNotification,
    );

    // Public routes
    this.router.post(
      "/login",
      zodValidate(LoginSchema, "body"),
      this.authController.login,
    );

    // this.router.post(
    //   "/verify-otp",
    //   zodValidate(VerifyOtpSchema, "body"),
    //   this.authController.verifyOtp,
    // );

    // Protected routes
    this.router.post("/logout", authenticate, this.authController.logout);
    this.router.get(
      "/me",
      authenticate,
      companyResolver,
      this.authController.getCurrentUser,
    );
    this.router.put(
      "/me",
      authenticate,
      companyResolver,
      zodValidate(UpdateAuthSchema, "body"),
      this.authController.update,
    );

    this.router.put(
      "/change-password",
      authenticate,
      companyResolver,
      this.authController.changePassword,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
