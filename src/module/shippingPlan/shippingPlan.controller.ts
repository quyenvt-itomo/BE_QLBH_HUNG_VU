import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { ShippingPlanService } from "./shippingPlan.service";
import { SHIPPING_PLAN_TYPES } from "./shippingPlan.types";
import { BaseController } from "@/shared/base/BaseController";
import { ShippingPlan } from "@/database/models/company/ShippingPlan";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import type { RequestContext } from "@/shared/types/interfaces";
import { RejectShippingPlanSchema } from "./shippingPlan.validator";
import { asyncHandler } from "@/shared/utils/controller.utils";

@injectable()
export class ShippingPlanController extends BaseController<ShippingPlan> {
  protected service: ShippingPlanService;

  constructor(
    @inject(SHIPPING_PLAN_TYPES.ShippingPlanService)
    service: ShippingPlanService,
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
            error: error instanceof Error ? error.message : "Unknown error",
            targetId: id,
          });
        next(error);
      }
    },
  );

  reject = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const dto = RejectShippingPlanSchema.parse(req.body);
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
        const data = await this.service.reject(id, dto, reqContext);
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
            error: error instanceof Error ? error.message : "Unknown error",
            targetId: id,
          });
        next(error);
      }
    },
  );
}
