import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/shared/types/errors";
import logger from "@/shared/utils/logger";
import { attributeModuleMap, AttributeTypeEnum } from "@/shared/constants/enum";

export const readPermission = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { type } = req.query;
      const module = attributeModuleMap[type as unknown as AttributeTypeEnum];
      const permissions = req.permissions || {};
      const modulePermissions = (permissions as any)[module] || [];
      console.log(modulePermissions);
      if (!modulePermissions.includes("read")) {
        throw new UnauthorizedError("Insufficient permissions");
      }

      next(); // Chỉ gọi next() một lần duy nhất ở cuối
    } catch (error) {
      logger.error(
        `Error in permission middleware for module ${module}:`,
        error,
      );
      if (!res.headersSent) {
        next(error);
      }
    }
  };
};
