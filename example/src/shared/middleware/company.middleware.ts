import { StoreType, Organization } from "@/database/models/Organization";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../types/errors";
import DatabaseConfig from "@/config/database";
import { In } from "typeorm";

export const companyResolver = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const storeId = req.headers["x-company-id"];

    if (!storeId || typeof storeId !== "string") {
      return next();
    }

    const companyRepo = DatabaseConfig.getRepository(Organization);
    const company = await companyRepo.findOne({
      where: { id: storeId, type: In(StoreType) },
    });

    if (!company) {
      throw new BadRequestError("Không tìm thấy thông tin công ty");
    }

    req.storeContext = {
      storeId: company.id,
      companyName: company.name,
      companyCode: company.code,
      companyType: company.type,
    };

    next();
  } catch (error) {
    next(error);
  }
};
