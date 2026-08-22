import { Store } from "@/database/models/Store";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../types/errors";
import DatabaseConfig from "@/config/database";
import { StoreUser } from "@/database/models/store/StoreUser";
import { createPermissionsByContext } from "./permission.middleware";
import { ErrorsMessages } from "../constants/errors";

/**
 * Extended Request interface with store information
 */
export interface RequestWithStore extends Request {
  store?: Store;
}

/**
 * Store Resolver Middleware
 * Xác định store từ request và attach store DataSource vào request
 */
export const storeResolver = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError("Store context required");
    }

    const storeCode = req.headers["x-store-code"];
    if (!storeCode || typeof storeCode !== "string") {
      return next();
    }

    req.storeCode = storeCode;

    const storeRepo = DatabaseConfig.getRepository(Store);
    const store = await storeRepo.findOne({ where: { code: storeCode } });

    if (!store) {
      throw new UnauthorizedError(`Store '${storeCode}' not found`, {
        field: "storeCode",
        code: ErrorsMessages.not_found,
      });
    }

    if (!store.isActive) {
      throw new UnauthorizedError(`Store '${storeCode}' is inactive`, {
        field: "storeCode",
        code: ErrorsMessages.inactive,
      });
    }

    req.store = store;
    if (req.method === "GET") {
      const newQuery = Object.assign({}, req.query as any);
      if (!newQuery.storeId) newQuery.storeId = store.id;
      Object.defineProperty(req, "query", {
        value: newQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      const newBody = Object.assign({}, req.body as any);
      if (!newBody.storeId) newBody.storeId = store.id;
      Object.defineProperty(req, "body", {
        value: newBody,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (req.user?.username === "admin") {
      req.permissions = createPermissionsByContext("store");
      return next();
    }

    const storeUserRepo = DatabaseConfig.getRepository(StoreUser);

    const storeUser = await storeUserRepo.findOne({
      where: {
        storeId: store.id,
        userId,
      },
      relations: {
        role: true,
      },
    });

    if (!storeUser) {
      throw new UnauthorizedError("No access to this store", {
        field: "storeCode",
        code: ErrorsMessages.forbidden,
      });
    }

    req.permissions =
      storeUser.role?.permissions ||
      createPermissionsByContext("store", "empty");

    next();
  } catch (error) {
    next(error);
  }
};
