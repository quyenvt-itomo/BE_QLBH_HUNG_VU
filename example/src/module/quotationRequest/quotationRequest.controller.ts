import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { QuotationRequestService } from "./quotationRequest.service";
import { QUOTATION_REQUEST_TYPES } from "./quotationRequest.types";
import { BaseController } from "@/shared/base/BaseController";
import { QuotationRequest } from "@/database/models/company/QuotationRequest";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import type { RequestContext } from "@/shared/types/interfaces";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { QuotationRequestPublicParamsDto } from "./quotationRequest.validator";

@injectable()
export class QuotationRequestController extends BaseController<QuotationRequest> {
  protected service: QuotationRequestService;

  constructor(
    @inject(QUOTATION_REQUEST_TYPES.QuotationRequestService)
    service: QuotationRequestService,
  ) {
    super();
    this.service = service;
  }

  getByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params as QuotationRequestPublicParamsDto;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.getByCode(code, reqContext);
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

  approve = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { createPartner = false } = req.body;
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
        const data = await this.service.approve(id, createPartner, reqContext);
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
}
