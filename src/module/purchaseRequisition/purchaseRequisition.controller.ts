import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { PurchaseRequisitionService } from "./purchaseRequisition.service";
import { PURCHASE_REQUISITION_TYPES } from "./purchaseRequisition.types";
import { BaseController } from "@/shared/base/BaseController";
import { PurchaseRequisition } from "@/database/models/company/PurchaseRequisition";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import { asyncHandler } from "@/shared/utils/controller.utils";

@injectable()
export class PurchaseRequisitionController extends BaseController<PurchaseRequisition> {
  protected service: PurchaseRequisitionService;

  constructor(
    @inject(PURCHASE_REQUISITION_TYPES.PurchaseRequisitionService)
    service: PurchaseRequisitionService,
  ) {
    super();
    this.service = service;
  }

  /**
   * POST /:id/approve - Phê duyệt phiếu đề nghị mua hàng
   */
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
        const beforeRecord = OperationLogUtils.toOperationRecord(before);
        const afterRecord = OperationLogUtils.toOperationRecord(data);
        if (logId)
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

  /**
   * POST /:id/reject - Từ chối phiếu đề nghị mua hàng
   */
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
        const reqContext = this.service.getReqContext(req);
        const before = await this.service.findById(id, undefined, reqContext);
        const data = await this.service.reject(id, rejectReason, reqContext);
        const beforeRecord = OperationLogUtils.toOperationRecord(before);
        const afterRecord = OperationLogUtils.toOperationRecord(data);
        if (logId)
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
