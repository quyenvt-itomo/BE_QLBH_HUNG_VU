import { Request, Response, NextFunction } from "express";
import { BaseService } from "./BaseService";
import { BaseEntity } from "./BaseEntity";
import { ErrorsMessages } from "../constants/errors";
import {
  IFindOptions,
  SendErrorParams,
  SendResponseParams,
} from "../types/interfaces";
import { OperationLogUtils } from "../utils/operationLog.utils";

export abstract class BaseController<T extends BaseEntity> {
  protected abstract service: BaseService<T>;

  protected getEntityName(): string {
    const constructorName =
      (this.service as any)?.repository?.constructor?.name || "entity";
    return constructorName.replace(/Repository$/, "").toLowerCase();
  }

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
      const options = req.query as unknown as IFindOptions<T>;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findAllWithPagination(
        options,
        undefined,
        reqContext,
      );
      if (data.data?.length)
        await this.service.hydrateEntities(data.data, reqContext);
      return res.status(data.statusCode).json(data);
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findAll();
      await this.service.hydrateEntities(data, reqContext);
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

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findById(id, undefined, reqContext);
      if (!data)
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu",
          data: null,
          statusCode: 404,
          errors: [{ field: "id", code: ErrorsMessages.not_found }],
        });
      await this.service.hydrateEntity(data, reqContext);
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

  create = async (req: Request, res: Response, next: NextFunction) => {
    const requestBody = OperationLogUtils.toOperationRecord(req.body);
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "create",
      targetEntity: this.getEntityName(),
      requestBody,
      success: false,
      markRequestLogged: true,
    });
    try {
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.create(req.body, undefined, reqContext);
      const after = OperationLogUtils.toOperationRecord(
        data as unknown as Record<string, unknown>,
      );
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: (data as any)?.id || null,
          requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
            requestBody,
            after,
          ),
          after,
        });
      await this.service.hydrateEntity(data, reqContext);
      return res.status(201).json({
        success: true,
        data,
        message: "Created successfully",
        statusCode: 201,
      });
    } catch (error) {
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          requestBody,
          error,
        });
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const requestBody = OperationLogUtils.toOperationRecord(req.body);
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "update",
      targetEntity: this.getEntityName(),
      targetId: id,
      requestBody,
      success: false,
      markRequestLogged: true,
    });
    try {
      const reqContext = this.service.getReqContext(req);
      const before = await this.service.findById(id, undefined, reqContext);
      const data = await this.service.update(
        id,
        req.body,
        undefined,
        reqContext,
      );
      if (!data) {
        if (logId)
          await OperationLogUtils.finalizeOperationLog({
            logId,
            success: false,
            targetId: id,
            before: OperationLogUtils.toOperationRecord(
              before as unknown as Record<string, unknown>,
            ),
            requestBody,
            error: { message: "Item not found", statusCode: 404 },
          });
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu",
          data: null,
          statusCode: 404,
          errors: [{ field: "id", code: ErrorsMessages.not_found }],
        });
      }
      const beforeRecord = OperationLogUtils.toOperationRecord(
        before as unknown as Record<string, unknown>,
      );
      const afterRecord = OperationLogUtils.toOperationRecord(
        data as unknown as Record<string, unknown>,
      );
      await OperationLogUtils.finalizeOperationLog({
        logId,
        success: true,
        targetId: id,
        before: beforeRecord,
        after: afterRecord,
        requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
          requestBody,
          afterRecord,
        ),
      });
      await this.service.hydrateEntity(data, reqContext);
      return res.json({
        success: true,
        data,
        message: "Updated successfully",
        statusCode: 200,
      });
    } catch (error) {
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: id,
          requestBody,
          error,
        });
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const requestBody = OperationLogUtils.toOperationRecord(req.body);
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "delete",
      targetEntity: this.getEntityName(),
      targetId: id,
      requestBody,
      success: false,
      markRequestLogged: true,
    });
    try {
      const reqContext = this.service.getReqContext(req);
      const before = await this.service.findById(id, undefined, reqContext);
      if (!before) {
        if (logId)
          await OperationLogUtils.finalizeOperationLog({
            logId,
            success: false,
            targetId: id,
            error: { message: "Item not found", statusCode: 404 },
          });
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu cần xóa",
          data: null,
          statusCode: 404,
          errors: [{ field: "id", code: ErrorsMessages.not_found }],
        });
      }
      await this.service.delete(id, undefined, reqContext);
      const beforeRecord = OperationLogUtils.toOperationRecord(
        before as unknown as Record<string, unknown>,
      );
      await OperationLogUtils.finalizeOperationLog({
        logId,
        success: true,
        targetId: id,
        before: beforeRecord,
        requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
          requestBody,
          beforeRecord,
        ),
      });
      return res.json({
        success: true,
        message: "Deleted successfully",
        statusCode: 200,
        data: id,
      });
    } catch (error) {
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: id,
          requestBody,
          error,
        });
      next(error);
    }
  };

  deleteMany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0)
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp danh sách IDs",
          data: null,
          statusCode: 400,
        });
      const reqContext = this.service.getReqContext(req);
      await this.service.deleteMany(ids, undefined, reqContext);
      return res.json({
        success: true,
        message: "Deleted successfully",
        statusCode: 200,
        data: ids,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSortOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { sortOrder } = req.body;
      const reqContext = this.service.getReqContext(req);
      const data = await (this.service as any).updateSortOrder?.(
        id,
        sortOrder,
        undefined,
        reqContext,
      );
      if (!data)
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu",
          data: null,
          statusCode: 404,
        });
      return res.json({
        success: true,
        data,
        message: "Sort order updated",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  checkExits = (idKey: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params[idKey] || req.body[idKey];
        if (!id)
          return res
            .status(400)
            .json({ success: false, message: "Missing ID", statusCode: 400 });
        const exists = await this.service.exists(id);
        return res.json({ success: true, data: { exists }, statusCode: 200 });
      } catch (error) {
        next(error);
      }
    };
  };
}
