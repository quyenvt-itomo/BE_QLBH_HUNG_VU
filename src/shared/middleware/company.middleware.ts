import { Request, Response, NextFunction } from "express";
import DatabaseConfig from "@/config/database";
import { Store } from "@/database/models/Store";

/** Resolves the active store; storeId remains only as a request-context alias. */
export const companyResolver = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const storeId = (req.headers["x-store-id"] || req.headers["x-store-id"]) as
      | string
      | undefined;
    if (!storeId) return next();
    const store = await DatabaseConfig.getRepository(Store).findOne({
      where: { id: storeId },
    });
    if (!store) return next(new Error("Store not found"));
    req.storeContext = {
      storeId: store.id,
      companyName: store.name,
      companyCode: store.code,
    };
    next();
  } catch (error) {
    next(error);
  }
};
