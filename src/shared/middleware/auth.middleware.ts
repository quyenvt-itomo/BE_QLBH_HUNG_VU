import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@/shared/types/errors";

//import { createFullPermissions } from "./permission.middleware";
import logger from "../utils/logger";
import { config } from "@/config/env";
import { AuthUtils } from "../utils/auth.utils";
import { JwtPayload } from "../types/interfaces";
import DatabaseConfig from "@/config/database";
import { User } from "@/database/models/User";
import { getUserSnapshot } from "../utils/utils";
import { createPermissions, MODULES } from "./permission.middleware";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    if (!refreshToken && !accessToken) {
      throw new UnauthorizedError("Authentication required");
    }

    // Ưu tiên access token
    if (accessToken) {
      const decoded = jwt.verify(
        accessToken,
        config.JWT_ACCESS_SECRET,
      ) as JwtPayload;

      req.user = decoded;
      return next();
    }

    // Fallback sang refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.JWT_REFRESH_SECRET,
    ) as JwtPayload;

    const newAccessToken = AuthUtils.generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
    });

    AuthUtils.setTokenCookies(res, {
      accessToken: newAccessToken,
      refreshToken,
    });

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorization = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const companyId = req.companyContext?.companyId;

    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const userRepo = DatabaseConfig.getRepository(User);

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: {
        companyUsers: {
          company: true,
          role: true,
          employee: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError("Không tìm thấy thông tin người dùng");
    }

    const userSnapshot = getUserSnapshot(user);
    req.userContext = userSnapshot
      ? {
          userId: user.id,
          userSnapshot,
          isAdmin: AuthUtils.isAdmin(user),
        }
      : null;

    if (AuthUtils.isAdmin(user)) {
      req.permissions = createPermissions();
      req.importExcel = [...MODULES];
      req.exportExcel = [...MODULES];
      return next();
    }

    if (companyId) {
      const companyUser = user.companyUsers?.find(
        (cu) => cu.companyId === companyId,
      );

      if (!companyUser) {
        throw new UnauthorizedError(
          "Bạn không có quyền truy cập vào công ty này",
        );
      }

      req.permissions = companyUser.role?.permissions;
      req.importExcel = companyUser.role?.importExcel || [];
      req.exportExcel = companyUser.role?.exportExcel || [];

      if (companyUser?.employeeId && req.userContext) {
        req.userContext.employeeId = companyUser.employeeId;
      }
    }

    next();
  } catch (error) {
    logger.error("Authorization error:", error);
    next(new UnauthorizedError("Authorization failed"));
  }
};
