import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { QuotationService } from "./quotation.service";
import { QUOTATION_TYPES } from "./quotation.types";
import { BaseController } from "@/shared/base/BaseController";
import { Quotation } from "@/database/models/company/Quotation";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import type { RequestContext } from "@/shared/types/interfaces";
import { asyncHandler } from "@/shared/utils/controller.utils";

@injectable()
export class QuotationController extends BaseController<Quotation> {
  protected service: QuotationService;

  constructor(
    @inject(QUOTATION_TYPES.QuotationService) service: QuotationService,
  ) {
    super();
    this.service = service;
  }

  approve = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const requestBody = OperationLogUtils.toOperationRecord(req.body);
      const logId = await OperationLogUtils.createOperationLog({
        req,
        action: "approve",
        targetEntity: this.getEntityName(),
        targetId: id,
        requestBody,
        success: false,
        markRequestLogged: true,
      });
      try {
        const reqContext =
          this.service.getReqContext(req) ?? ({} as RequestContext);
        const before = await this.service.findById(id, undefined, reqContext);
        const data = await this.service.approve(id, reqContext);
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          before: OperationLogUtils.toOperationRecord(before),
          after: OperationLogUtils.toOperationRecord(data),
          requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
            requestBody,
            OperationLogUtils.toOperationRecord(data),
          ),
        });
        await this.service.hydrateEntity(data, reqContext);
        return res.json({
          success: true,
          data,
          message: "Phê duyệt thành công",
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
    },
  );

  reject = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const requestBody = OperationLogUtils.toOperationRecord(req.body);
      const logId = await OperationLogUtils.createOperationLog({
        req,
        action: "reject",
        targetEntity: this.getEntityName(),
        targetId: id,
        requestBody,
        success: false,
        markRequestLogged: true,
      });
      try {
        const reqContext =
          this.service.getReqContext(req) ?? ({} as RequestContext);
        const before = await this.service.findById(id, undefined, reqContext);
        const data = await this.service.reject(id, rejectReason, reqContext);
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          before: OperationLogUtils.toOperationRecord(before),
          after: OperationLogUtils.toOperationRecord(data),
          requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
            requestBody,
            OperationLogUtils.toOperationRecord(data),
          ),
        });
        await this.service.hydrateEntity(data, reqContext);
        return res.json({
          success: true,
          data,
          message: "Từ chối thành công",
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
    },
  );

  customerApprove = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const requestBody = OperationLogUtils.toOperationRecord(req.body);
      const logId = await OperationLogUtils.createOperationLog({
        req,
        action: "customerApprove",
        targetEntity: this.getEntityName(),
        targetId: id,
        requestBody,
        success: false,
        markRequestLogged: true,
      });
      try {
        const reqContext =
          this.service.getReqContext(req) ?? ({} as RequestContext);
        const before = await this.service.findById(id, undefined, reqContext);
        const data = await this.service.customerApprove(id, reqContext);
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          before: OperationLogUtils.toOperationRecord(before),
          after: OperationLogUtils.toOperationRecord(data),
          requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
            requestBody,
            OperationLogUtils.toOperationRecord(data),
          ),
        });
        return res.status(201).json({
          success: true,
          data,
          message: "Khách hàng duyệt báo giá thành công",
          statusCode: 201,
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
    },
  );

  customerReject = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { rejectReason } = req.body;
      const requestBody = OperationLogUtils.toOperationRecord(req.body);
      const logId = await OperationLogUtils.createOperationLog({
        req,
        action: "customerReject",
        targetEntity: this.getEntityName(),
        targetId: id,
        requestBody,
        success: false,
        markRequestLogged: true,
      });
      try {
        const reqContext =
          this.service.getReqContext(req) ?? ({} as RequestContext);
        const before = await this.service.findById(id, undefined, reqContext);
        const data = await this.service.customerReject(
          id,
          rejectReason,
          reqContext,
        );
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          before: OperationLogUtils.toOperationRecord(before),
          after: OperationLogUtils.toOperationRecord(data),
          requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
            requestBody,
            OperationLogUtils.toOperationRecord(data),
          ),
        });
        await this.service.hydrateEntity(data, reqContext);
        return res.json({
          success: true,
          data,
          message: "Khách hàng từ chối báo giá thành công",
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
    },
  );
}
