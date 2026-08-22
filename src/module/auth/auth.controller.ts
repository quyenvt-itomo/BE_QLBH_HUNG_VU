import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import {
  asyncHandler,
  sendError,
  sendResponse,
} from "@/shared/utils/controller.utils";
import { AuthService } from "./auth.service";
import logger from "@/shared/utils/logger";
import { AUTH_TYPES } from "./auth.types";
import { UnauthorizedError } from "@/shared/types/errors";
import { LoginDto } from "./auth.validator";
import { RequestWithUser } from "@/shared/types/interfaces";
import { NOTIFICATION_TYPES, NotificationService } from "../notification";
import { NotificationRepository } from "../notification/notification.repository";
import { BaseParamsDto } from "@/shared/base/BaseValidator";

@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService) private authService: AuthService,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
    @inject(NOTIFICATION_TYPES.NotificationRepository)
    private notificationRepository: NotificationRepository,
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
          message: error.message || "Login failed",
          statusCode: 401,
          errors: error.errors || [],
        });
      }
    },
  );

  logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;

        // Clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        //if (userId) await this.authService.logout(userId);

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
    async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          throw new Error("User not authenticated");
        }
        const companyId = req.companyContext?.companyId || undefined;
        const user = await this.authService.getCurrent(userId, companyId);
        const { password, ...userWithoutPassword } = user;
        sendResponse({ res, data: userWithoutPassword });
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

  changePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          throw new Error("User not authenticated");
        }
        const { oldPassword, newPassword, isLogout } = req.body;
        await this.authService.changePassword(userId, oldPassword, newPassword);
        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[changePassword]:", error);
        next(error);
      }
    },
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          throw new UnauthorizedError("User not authenticated");
        }
        const data = req.body;
        const result = await this.authService.update(userId, data);
        sendResponse({ res, data: result });
      } catch (error: any) {
        logger.error("Error AuthController:[update]:", error);
        sendError({
          res,
          message: error.message || "Failed to update user",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  getUserNotifications = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        const { page = 1, size = 10 } = req.query;
        const result = await this.notificationRepository.findWithPagination({
          skip: Number(page),
          take: Number(size),
          moreQuery: { userId },
        });

        const totalUnread =
          await this.notificationService.countUnreadNotifications(userId);

        res.status(200).json({
          success: true,
          message: "ok",
          data: result.data,
          pagination: {
            totalRecords: result.total,
            size: Number(size),
            currentPage: Number(page),
            totalPages: Math.ceil(result.total / Number(size)),
          },
          summary: {
            totalUnread,
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
      const userId = req.user?.userId;
      const { id } = req.params as BaseParamsDto;

      try {
        if (!userId) {
          throw new Error("User not authenticated");
        }
        await this.notificationService.markAsRead(userId, id);

        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[seenUserNotification]:", error);
        sendError({
          res,
          message: error.message || "Failed to mark notification as read",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  seenUserNotifications = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      const notificationIds = req.body.ids;

      try {
        if (!userId) {
          throw new Error("User not authenticated");
        }
        await this.notificationService.markManyAsRead(userId, notificationIds);

        sendResponse({ res });
      } catch (error: any) {
        logger.error("Error AuthController:[seenUserNotifications]:", error);
        sendError({
          res,
          message: error.message || "Failed to mark notifications as read",
          statusCode: 400,
          errors: error.errors || [],
        });
      }
    },
  );

  seenAllUserNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
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
}
