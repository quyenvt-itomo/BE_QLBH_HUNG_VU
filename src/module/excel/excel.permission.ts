import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@/shared/types/errors";
import { ExcelEntityType } from "./excel.types";
import { Module } from "@/shared/middleware/permission.middleware";

export function excelPermissionMiddleware(action: "import" | "export") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const allowed = action === "import" ? req.importExcel : req.exportExcel;

      if (!allowed || allowed.length === 0) {
        throw new BadRequestError("Tài khoản chưa được phân quyền");
      }

      const entityType = req.body?.entityType || req.params?.entityType;
      if (!entityType) return next();

      const moduleName = mapEntityTypeToModule(entityType as ExcelEntityType);
      if (!allowed.includes(moduleName)) {
        throw new BadRequestError(
          `Bạn không có quyền ${action === "import" ? "nhập" : "xuất"} Excel cho đối tượng này`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function mapEntityTypeToModule(entityType: ExcelEntityType): Module {
  const map: Record<ExcelEntityType, Module> = {
    [ExcelEntityType.PARTNER]: "partner",
    [ExcelEntityType.EMPLOYEE]: "employee",
    [ExcelEntityType.USER]: "user",
    [ExcelEntityType.PRODUCT]: "product",
    [ExcelEntityType.SERVICE]: "service",
    [ExcelEntityType.JOB_POSITION]: "jobPosition",
    [ExcelEntityType.WAREHOUSE]: "warehouse",
    [ExcelEntityType.PRICE_HISTORY]: "product",
  };
  return map[entityType];
}
