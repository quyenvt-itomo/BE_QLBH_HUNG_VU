// shared/middleware/order-context.middleware.ts
import { OrderType } from "@/database/models";
import { Request, Response, NextFunction } from "express";

export type OrderModule =
  | "sale"
  | "purchase"
  | "saleReturn"
  | "purchaseReturn";

export interface OrderContext {
  module: OrderModule;
  type: OrderModule;
}

declare module "express-serve-static-core" {
  interface Request {
    orderContext?: OrderContext;
  }
}

export const orderContextMiddleware =
  (module: OrderModule) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.orderContext = {
      module,
      type: module,
    };

    // OPTIONAL: nếu bạn muốn service nhận type từ body/query
    const mappedType = module === "sale" ? OrderType.SALE : module === "purchase" ? OrderType.PURCHASE : module === "saleReturn" ? OrderType.SALE_RETURN : OrderType.PURCHASE_RETURN;

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
