// shared/middleware/partner-context.middleware.ts
import { PartnerTypeEnum } from "@/shared/constants/enum";
import { Request, Response, NextFunction } from "express";

export type PartnerModule = "customer" | "supplier";

export interface PartnerContext {
  module: PartnerModule;
  type: PartnerModule;
}

declare module "express-serve-static-core" {
  interface Request {
    partnerContext?: PartnerContext;
  }
}

export const partnerContextMiddleware =
  (module: PartnerModule) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.partnerContext = {
      module,
      type: module,
    };

    // OPTIONAL: nếu bạn muốn service nhận type từ body/query
    const mappedType =
      module === "customer"
        ? PartnerTypeEnum.CUSTOMER
        : PartnerTypeEnum.SUPPLIER;

    if (req.method === "GET") {
      const newQuery = Object.assign({}, req.query as any);
      if (!newQuery.type) newQuery.type = mappedType;
      Object.defineProperty(req, "query", {
        value: newQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      const newBody = Object.assign({}, req.body as any);
      if (!newBody.type) newBody.type = mappedType;
      Object.defineProperty(req, "body", {
        value: newBody,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    next();
  };
