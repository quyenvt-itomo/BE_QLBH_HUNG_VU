import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { PaymentRequestService } from "./paymentRequest.service";
import { PAYMENT_REQUEST_TYPES } from "./paymentRequest.types";
import { BaseController } from "@/shared/base/BaseController";
import { PaymentRequest } from "@/database/models/company/PaymentRequest";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import type { RequestContext } from "@/shared/types/interfaces";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { RejectPaymentRequestSchema } from "./paymentRequest.validator";

@injectable()
export class PaymentRequestController extends BaseController<PaymentRequest> {
  protected service: PaymentRequestService;

  constructor(
    @inject(PAYMENT_REQUEST_TYPES.PaymentRequestService)
    service: PaymentRequestService,
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
        const data = await this.service.approve(id, req);
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
      const dto = RejectPaymentRequestSchema.parse(req.body);
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
        const data = await this.service.reject(id, dto, req);
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
