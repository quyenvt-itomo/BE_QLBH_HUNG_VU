// shared/middleware/partner-context.middleware.ts
import { PartnerType } from "@/database/models/Partner";
import { PartnerModule } from "@/shared/types/sub-context";
import { Request, Response, NextFunction } from "express";

export const partnerContextMiddleware =
  (module: PartnerModule) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.partnerContext = {
      module,
      type: module,
    };

    // OPTIONAL: nếu bạn muốn service nhận type từ body/query
    const mappedType =
      module === "customer" ? PartnerType.CUSTOMER : PartnerType.SUPPLIER;

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
