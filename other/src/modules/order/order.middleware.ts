// shared/middleware/order-context.middleware.ts
import { OrderTypeEnum } from "@/shared/constants/enum";
import { Request, Response, NextFunction } from "express";

export type OrderModule =
  | "saleOrder"
  | "purchaseOrder"
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
    const mappedType =
      module === "saleOrder"
        ? OrderTypeEnum.SALE
        : module === "purchaseOrder"
          ? OrderTypeEnum.PURCHASE
          : module === "saleReturn"
            ? OrderTypeEnum.SALE_RETURN
            : OrderTypeEnum.PURCHASE_RETURN;

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
