import { injectable, inject } from "inversify";
import { StockDocumentService } from "./stockDocument.service";
import { STOCK_DOCUMENT_TYPES } from "./stockDocument.types";
import { BaseController } from "@/shared/base/BaseController";
import { StockDocument } from "@/database/models/company/StockDocument";
import { asyncHandler } from "@/shared/utils/controller.utils";
import {
  ConfirmExportDto,
  ConfirmImportDto,
  ConfirmBillingDto,
} from "./stockDocument.validator";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";

@injectable()
export class StockDocumentController extends BaseController<StockDocument> {
  protected service: StockDocumentService;

  constructor(
    @inject(STOCK_DOCUMENT_TYPES.StockDocumentService)
    service: StockDocumentService,
  ) {
    super();
    this.service = service;
  }

  confirmExport = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = req.body as ConfirmExportDto;
    const reqContext = this.service.getReqContext(req);

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "confirmExport",
      targetEntity: this.getEntityName(),
      targetId: id,
      requestBody: OperationLogUtils.toOperationRecord(dto),
      success: false,
    });

    try {
      const data = await this.service.confirmExport(id, dto, reqContext);
      await OperationLogUtils.finalizeOperationLog({
        logId,
        success: true,
        targetId: id,
        after: OperationLogUtils.toOperationRecord(
          data as unknown as unknown as Record<string, unknown>,
        ),
      });
      this.sendResponse({ res, data });
    } catch (error) {
      await OperationLogUtils.finalizeOperationLog({
        logId,
        success: false,
        targetId: id,
        error,
      });
      throw error;
    }
  });

  confirmImport = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = req.body as ConfirmImportDto;
    const reqContext = this.service.getReqContext(req);

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "confirmImport",
      targetEntity: this.getEntityName(),
      targetId: id,
      requestBody: OperationLogUtils.toOperationRecord(dto),
      success: false,
    });

    try {
      const data = await this.service.confirmImport(id, dto, reqContext);
      await OperationLogUtils.finalizeOperationLog({
        logId,
        success: true,
        targetId: id,
        after: OperationLogUtils.toOperationRecord(
          data as unknown as unknown as Record<string, unknown>,
        ),
      });
      this.sendResponse({ res, data });
    } catch (error) {
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
    const dto = req.body as ConfirmBillingDto;
    const reqContext = this.service.getReqContext(req);

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "complete",
      targetEntity: this.getEntityName(),
      targetId: id,
      requestBody: OperationLogUtils.toOperationRecord(dto),
      success: false,
    });

    try {
      const data = await this.service.confirmComplete(id, dto, reqContext);
      await OperationLogUtils.finalizeOperationLog({
        logId,
        success: true,
        targetId: id,
        after: OperationLogUtils.toOperationRecord(
          data as unknown as unknown as Record<string, unknown>,
        ),
      });
      this.sendResponse({ res, data });
    } catch (error) {
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
