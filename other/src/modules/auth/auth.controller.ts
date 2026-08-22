import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { LoginDto } from "@/modules/auth/auth.validator";
import {
  asyncHandler,
  sendError,
  sendResponse,
} from "@/shared/utils/controller.utils";
import { NotificationService } from "@/modules/notification/notification.service";
import { AuthService } from "./auth.service";
import logger from "@/shared/utils/logger";
import { AUTH_TYPES } from "./auth.types";
import { NOTIFICATION_TYPES } from "../notification/notification.types";
import { UnauthorizedError } from "@/shared/types/errors";
import { User } from "@/database/models/User";

@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService) private authService: AuthService,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {}

  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const loginData: LoginDto = req.body;

        const result = await this.authService.login(loginData, res);

        // Remove sensitive data
        const { password, ...userResponse } = result.user;

        sendResponse({
          res,
          data: userResponse,
        });
      } catch (error: any) {
        logger.error("Error AuthController:[login]:", error);
        sendError({
          res,
          message: "Login failed",
          statusCode: 401,
          errors: error.errors || [],
        });
      }
    },
  );

  logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;

        // Clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        if (userId) await this.authService.logout(userId);

        sendResponse({
          res,
          message: "Logged out successfully",
        });
      } catch (error: any) {
        logger.error("Error AuthController:[logout]:", error);
        sendResponse({
          res,
          message: "Logged out successfully",
        });
      }
    },
  );

  getCurrentUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;
        const storeCode = (req.headers["x-store-code"] as string) || undefined;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const {
          user,
          currentStore,
          permissions,
          systemPermissions,
          stores,
          defaultFund,
          role,
          currentShift,
        } = await this.authService.getCurrent(userId, storeCode);

        if (!user) {
          throw new UnauthorizedError("User not found");
        }

        const { password, ...userResponse } = user;

        sendResponse({
          res,
          data: {
            ...userResponse,
            currentStore,
            permissions,
            systemPermissions,
            stores,
            defaultFund,
            role,
            currentShift,
          },
        });
      } catch (error: any) {
        logger.error("Error AuthController:[getCurrentUser]:", error);
        sendError({
          res,
          message: "Failed to get current user",
          statusCode: 401,
          errors: error.errors || [],
        });
      }
    },
  );

  updateInfo = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        const data: Partial<User> = req.body;

        await this.authService.updateInfo(userId!, data);

        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[changeInfo]:", error);
        sendError({
          res,
          message: "Failed to change user info",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  changePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
          throw new Error("User not authenticated");
        }
        const { oldPassword, newPassword, isLogout } = req.body;
        await this.authService.changePassword(userId, oldPassword, newPassword);
        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[changePassword]:", error);
        sendError({
          res,
          message: "Failed to change password",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  getUserNotifications = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        const { page = 1, size = 10 } = req.query;
        const notifications =
          await this.notificationService.getUserNotifications(
            userId,
            Number(page),
            Number(size),
          );

        res.status(200).json({
          success: true,
          message: "ok",
          data: notifications.data,
          pagination: {
            totalRecords: notifications.total,
            size: notifications.size,
            currentPage: notifications.page,
            totalPages: notifications.totalPages,
          },
          summary: {
            totalUnread: notifications.totalUnread,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error("Error AuthController:[getUserNotifications]:", error);
        sendError({
          res,
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  seenUserNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
          throw new Error("User not authenticated");
        }
        const notificationIds = req.body.ids;
        await this.notificationService.markManyAsRead(userId, notificationIds);
        sendResponse({ res });
      } catch (error) {
        logger.error("Error AuthController:[seenUserNotification]:", error);
      }
    },
  );

  seenAllUserNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        await this.notificationService.markAllAsRead(userId);
        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[seenAllUserNotification]:", error);
        sendError({
          res,
          message: error.message || "Failed to mark all notifications as read",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );
  verifyOtp = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token =
          (req as any).headers["x-verify-otp-token"] ||
          (req as any).cookies?.verifyOtpToken;

        const data = req.body;
        await this.authService.verifyOtp(data, token);
        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[verifyOtp]:", error);
        sendError({
          res,
          message: error.message || "OTP verification failed",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  getMyShifts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
          throw new Error("User not authenticated");
        }

        const result = await this.authService.getMyShifts(
          userId,
          req.query,
          req as any,
        );

        res.status(200).json({
          success: true,
          message: "ok",
          data: result.data,
          pagination: result.pagination,
          summary: result.summary,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error("Error AuthController:[getMyShifts]:", error);
        sendError({
          res,
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );
}
