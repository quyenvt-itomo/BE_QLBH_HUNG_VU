import { injectable, inject } from "inversify";
import { ProductionService } from "./production.service";
import { PRODUCTION_TYPES } from "./production.types";
import { BaseController } from "@/shared/base/BaseController";
import { Production } from "@/database/models/company/Production";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";

@injectable()
export class ProductionController extends BaseController<Production> {
  protected service: ProductionService;

  constructor(
    @inject(PRODUCTION_TYPES.ProductionService) service: ProductionService,
  ) {
    super();
    this.service = service;
  }

  start = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "start",
      targetEntity: this.getEntityName(),
      targetId: id,
      success: false,
    });
    try {
      const data = await this.service.start(id, this.service.getReqContext(req));
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          after: OperationLogUtils.toOperationRecord(
            data as unknown as Record<string, unknown>,
          ),
        });
      this.sendResponse({ res, data });
    } catch (error) {
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: id,
          error,
        });
      throw error;
    }
  });

  complete = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "complete",
      targetEntity: this.getEntityName(),
      targetId: id,
      success: false,
    });
    try {
      const data = await this.service.complete(id, this.service.getReqContext(req));
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          after: OperationLogUtils.toOperationRecord(
            data as unknown as Record<string, unknown>,
          ),
        });
      this.sendResponse({ res, data });
    } catch (error) {
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: id,
          error,
        });
      throw error;
    }
  });

  cancel = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "cancel",
      targetEntity: this.getEntityName(),
      targetId: id,
      success: false,
    });
    try {
      const data = await this.service.cancel(id, this.service.getReqContext(req));
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          after: OperationLogUtils.toOperationRecord(
            data as unknown as Record<string, unknown>,
          ),
        });
      this.sendResponse({ res, data });
    } catch (error) {
      if (logId)
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: id,
          error,
        });
      throw error;
    }
  });
}
