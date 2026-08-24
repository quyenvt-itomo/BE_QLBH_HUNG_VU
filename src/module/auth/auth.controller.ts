import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import {
  asyncHandler,
  sendError,
  sendResponse,
} from "@/shared/utils/controller.utils";
import { AuthService } from "./auth.service";
import { AUTH_TYPES } from "./auth.types";
import {
  NOTIFICATION_TYPES,
  NotificationRepository,
  NotificationService,
} from "../notification";
import logger from "@/shared/utils/logger";
import { BaseParamsDto } from "@/shared/base/BaseValidator";

@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService) private readonly service: AuthService,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
    @inject(NOTIFICATION_TYPES.NotificationRepository)
    private notificationRepository: NotificationRepository,
  ) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.login(req.body, res);
    const { password: _password, ...user } = result.user as any;
    res.json({
      success: true,
      statusCode: 200,
      message: "auth.login.success",
      data: user,
    });
  });
  logout = asyncHandler(async (req: Request, res: Response) => {
    await this.service.logout(req.user!.userId);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({
      success: true,
      statusCode: 200,
      message: "auth.logout.success",
      data: true,
    });
  });
  current = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getCurrent(
      req.user!.userId,
      req.storeContext?.storeId,
    );
    const { password: _password, ...user } = data;
    res.json({ success: true, statusCode: 200, message: "OK", data: user });
  });
  update = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.update(req.user!.userId, req.body);
    res.json({ success: true, statusCode: 200, message: "updated", data });
  });
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    await this.service.changePassword(
      req.user!.userId,
      req.body.oldPassword,
      req.body.newPassword,
    );
    res.json({
      success: true,
      statusCode: 200,
      message: "updated",
      data: true,
    });
  });

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
