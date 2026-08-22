import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { ExcelService } from "./excel.service";
import { EXCEL_TYPES } from "./excel.types";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";

@injectable()
export class ExcelController {
  constructor(
    @inject(EXCEL_TYPES.ExcelService)
    private excelService: ExcelService,
  ) {}

  export = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const requestBody = OperationLogUtils.toOperationRecord(req.body);
      const logId = await OperationLogUtils.createOperationLog({
        req,
        action: "export",
        targetEntity: "excel",
        requestBody,
        markRequestLogged: true,
      });

      try {
        const result = await this.excelService.exportToFile(
          req as any,
          req.body,
        );
        OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          requestBody,
          after: OperationLogUtils.toOperationRecord(result),
        });
        this.sendResponse(res, { data: result });
      } catch (error) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          error,
        });
        next(error);
      }
    },
  );

  download = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const buffer = await this.excelService.exportData(req as any, req.body);
        const filename = req.body.filename || `${req.body.entityType}.xlsx`;
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(filename)}"`,
        );
        res.send(buffer);
      } catch (error) {
        next(error);
      }
    },
  );

  import = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const requestBody = OperationLogUtils.toOperationRecord(req.body);
      const logId = await OperationLogUtils.createOperationLog({
        req,
        action: "import",
        targetEntity: "excel",
        requestBody,
        markRequestLogged: true,
      });

      try {
        const result = await this.excelService.startImportJob(
          req as any,
          req.body,
        );
        OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          requestBody,
          after: OperationLogUtils.toOperationRecord(result),
        });
        this.sendResponse(res, { data: result });
      } catch (error) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          error,
        });
        next(error);
      }
    },
  );

  getTemplate = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.excelService.getTemplate({
          entityType: req.params.entityType as any,
          branchId: req.query.branchId as string,
        });
        this.sendResponse(res, { data: result });
      } catch (error) {
        next(error);
      }
    },
  );

  getJobProgress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const job = this.excelService.getJobProgress(req.params.jobId);
        if (!job) {
          return res
            .status(404)
            .json({ success: false, message: "Job not found" });
        }
        this.sendResponse(res, { data: job });
      } catch (error) {
        next(error);
      }
    },
  );

  streamProgress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        this.excelService.addSseClient(req.params.jobId, res);
      } catch (error) {
        next(error);
      }
    },
  );

  private sendResponse(
    res: Response,
    { data = null, message = "Success", statusCode = 200 }: any,
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
