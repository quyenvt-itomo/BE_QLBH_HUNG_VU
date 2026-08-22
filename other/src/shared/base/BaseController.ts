import { Request, Response, NextFunction } from "express";
import { BaseService } from "./BaseService";
import { ObjectLiteral } from "typeorm";
import { ErrorsMessages } from "../constants/errors";
import {
  IFindOptions,
  SendErrorParams,
  SendResponseParams,
} from "../types/interfaces";
import { NotFoundError } from "../types/errors";

/**
 * Base Controller cho  Entities
 */
export abstract class BaseController<T extends ObjectLiteral> {
  protected abstract service: BaseService<T>;

  protected sendResponse({
    res,
    data = null,
    message = "Success",
    statusCode = 200,
  }: SendResponseParams): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected sendError({
    res,
    message = "Error",
    statusCode = 500,
    errors = [],
  }: SendErrorParams): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  getAllWithPagination = async (
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as IFindOptions<T>; // Cast to any for simplicity

      const data = await this.service.findAllWithPagination(
        options,
        undefined,
        req,
      );
      return res.status(data.statusCode).json(data);
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  /**
   * GET /
   * Get all items
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findAll();

      return res.status(200).json({
        success: true,
        data,
        statusCode: 200,
        message: "Fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /:id
   * Get item by ID
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const data = await this.service.findById(id, req);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
          data: null,
          statusCode: 404,
          errors: {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        });
      }

      return res.json({
        success: true,
        data,
        message: "Fetched successfully",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /
   * Create new item
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body, undefined, req);

      return res.status(201).json({
        success: true,
        data,
        message: "Created successfully",
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /:id
   * Update item
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const data = await this.service.update(id, req.body, undefined, req);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
          data: null,
          statusCode: 404,
          errors: {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        });
      }

      return res.json({
        success: true,
        data,
        message: "Updated successfully",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /:id
   * Delete item (soft delete)
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const deleted = await this.service.delete(id, undefined, req);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
          data: null,
          statusCode: 404,
          errors: {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        });
      }

      return res.json({
        success: true,
        message: "Deleted successfully",
        statusCode: 200,
        data: id,
      });
    } catch (error) {
      next(error);
    }
  };

  checkExits = (idKey: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params?.[idKey];

        if (!id) {
          throw new NotFoundError("id.not_found", {
            field: idKey,
            code: ErrorsMessages.not_found,
          });
        }

        const exists = await this.service.exists(id as any);
        if (!exists) {
          throw new NotFoundError("id.not_found", {
            field: idKey,
            code: ErrorsMessages.not_found,
          });
        }

        return next();
      } catch (error) {
        return next(error);
      }
    };
  };
}
