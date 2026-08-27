import { Request, Response, NextFunction } from "express";
import { BadRequestError, ForbiddenError } from "@/shared/types/errors";
import { ExcelEntityType } from "./excel.types";
import { EXCEL_MODULES } from "@/shared/types/excel";

export const excelPermissionMiddleware =
  (action: "import" | "export") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const requestedEntityType = String(
        req.body?.entityType || req.params?.entityType || "",
      );
      const entityType = requestedEntityType || ExcelEntityType.PRODUCT;
      if (entityType !== ExcelEntityType.PRODUCT) {
        throw new BadRequestError(
          "Excel hiện chỉ hỗ trợ nhập/xuất dữ liệu hàng hóa",
        );
      }

      const permissions =
        action === "import" ? req.importExcel : req.exportExcel;
      if (!permissions?.includes(EXCEL_MODULES[0])) {
        throw new ForbiddenError(
          action === "import"
            ? "Bạn không có quyền nhập Excel hàng hóa"
            : "Bạn không có quyền xuất Excel hàng hóa",
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
