import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { PurchaseQuotationService } from "./purchaseQuotation.service";
import { PURCHASE_QUOTATION_TYPES } from "./purchaseQuotation.types";
import { BaseController } from "@/shared/base/BaseController";
import { PurchaseQuotation } from "@/database/models/company/PurchaseQuotation";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import { PurchaseQuotationPublicParamsDto } from "./purchaseQuotation.validator";
import { ApproveRejectDto } from "../quotationRequest";
import { asyncHandler } from "@/shared/utils/controller.utils";

@injectable()
export class PurchaseQuotationController extends BaseController<PurchaseQuotation> {
  protected service: PurchaseQuotationService;

  constructor(
    @inject(PURCHASE_QUOTATION_TYPES.PurchaseQuotationService)
    service: PurchaseQuotationService,
  ) {
    super();
    this.service = service;
  }

  getByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params as PurchaseQuotationPublicParamsDto;
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
        const reqContext = this.service.getReqContext(req);
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
      const createData = req.body as ApproveRejectDto;
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
        const reqContext = this.service.getReqContext(req);
        const before = await this.service.findById(id, undefined, reqContext);
        const data = await this.service.reject(id, createData, reqContext);
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
