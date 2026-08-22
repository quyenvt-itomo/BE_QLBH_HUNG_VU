import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { injectCompanyIdToArrays } from "../utils/utils";

/**
 * Middleware bơm thông tin người dùng (creator/updater) và companyId vào dữ liệu request.
 *
 * ⚠️ PHẢI đặt SAU `authorization` trong chuỗi middleware vì phụ thuộc `req.userContext`.
 *
 * - Với GET → scope = "query", chỉ inject `companyId` (nếu user STORE), KHÔNG gắn audit fields.
 * - Với các method còn lại → scope = "body":
 *    + Gắn creatorId/updaterId + snapshot
 *    + Gắn companyId (nếu user STORE) - không ghi đè companyId FE gửi nếu user là admin/system
 *    + Inject companyId xuống các array con (items, variants, options, ...)
 *    + Hỗ trợ cả body là object (create/update) lẫn body là `{ data: T[] }` (createMany)
 */
export const injectRequestContext = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const userCtx = req.userContext;
    const companyCtx = req.companyContext;

    const scope = req.method === "GET" ? "query" : "body";
    const source = req[scope] as any;

    const enrich = (item: Record<string, any>): Record<string, any> => {
      let next: Record<string, any> = { ...item };

      if (userCtx) {
        if (scope === "body") {
          next.creatorId = userCtx.userId;
          next.creatorSnapshot = userCtx.userSnapshot;
          next.updaterId = userCtx.userId;
          next.updaterSnapshot = userCtx.userSnapshot;
        }
      }

      // Ưu tiên companyId user STORE; nếu không có thì giữ companyId FE gửi (admin/system)
      if (companyCtx) {
        next.companyId = next.companyId || companyCtx.companyId;
      }

      // Inject companyId xuống các array con (chỉ áp dụng cho body)
      if (scope === "body" && next.companyId) {
        next = injectCompanyIdToArrays(next, next.companyId);
      }

      return next;
    };

    let newData: any;
    if (
      scope === "body" &&
      source &&
      typeof source === "object" &&
      Array.isArray((source as any).data)
    ) {
      newData = {
        ...source,
        data: (source as any).data.map((item: any) =>
          item && typeof item === "object" ? enrich(item) : item,
        ),
      };
    } else {
      newData = enrich((source as Record<string, any>) || {});
    }

    Object.defineProperty(req, scope, {
      value: newData,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  } catch (error) {
    logger.error("injectRequestContext error:", error);
    next(error);
  }
};
