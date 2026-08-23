import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@/shared/types/errors";
import { config } from "@/config/env";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { JwtPayload } from "@/shared/types/interfaces";
import DatabaseConfig from "@/config/database";
import { User } from "@/database/models/User";
import { getUserSnapshot } from "@/shared/utils/utils";
import { createPermissions, MODULES } from "./permission.middleware";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    if (!accessToken && !refreshToken)
      throw new UnauthorizedError("Authentication required");

    if (accessToken) {
      req.user = jwt.verify(
        accessToken,
        config.JWT_ACCESS_SECRET,
      ) as JwtPayload;
      return next();
    }

    const decoded = jwt.verify(
      refreshToken,
      config.JWT_REFRESH_SECRET,
    ) as JwtPayload;
    const renewedAccessToken = AuthUtils.generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
    });
    AuthUtils.setTokenCookies(res, {
      accessToken: renewedAccessToken,
      refreshToken,
    });
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorization = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError("User not authenticated");

    const user = await DatabaseConfig.getRepository(User).findOne({
      where: { id: userId, deletedAt: null } as any,
      relations: { role: true, storeUsers: true },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedError("User is inactive or not found");

    const isAdmin = AuthUtils.isAdmin(user);
    const storeId = req.storeContext?.storeId || req.storeContext?.storeId;
    if (
      storeId &&
      !isAdmin &&
      !(user.storeUsers || []).some(
        (membership) => membership.storeId === storeId,
      )
    ) {
      throw new UnauthorizedError("User has no access to this store");
    }

    const snapshot = getUserSnapshot(user);
    req.userContext = snapshot
      ? { userId: user.id, userSnapshot: snapshot, isAdmin }
      : null;
    req.permissions = isAdmin
      ? createPermissions()
      : user.role?.permissions || {};
    req.importExcel = isAdmin ? [...MODULES] : [];
    req.exportExcel = isAdmin ? [...MODULES] : [];
    next();
  } catch (error) {
    next(
      error instanceof UnauthorizedError
        ? error
        : new UnauthorizedError("Authorization failed"),
    );
  }
};
