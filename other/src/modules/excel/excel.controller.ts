import { injectable, inject } from "inversify";
import { NextFunction, Request, Response } from "express";
import { EXCEL_TYPES } from "./excel.types";
import { ExcelService } from "./excel.service";
import { ExportOptionsDto, ImportOptionsDto } from "./excel.validator";
import logger from "@/shared/utils/logger";
import {
  asyncHandler,
  sendError,
  sendResponse,
} from "@/shared/utils/controller.utils";

/**
 * Excel Controller
 * Xử lý các API requests cho Excel import/export
 */
@injectable()
export class ExcelController {
  constructor(
    @inject(EXCEL_TYPES.ExcelService)
    private excelService: ExcelService,
  ) {}

  /**
   * Export dữ liệu ra Excel
   * POST /api/v1/excel/export
   */
  export = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const options: ExportOptionsDto = req.body;

        const result = await this.excelService.exportToFile(req, options);

        sendResponse({
          res,
          message: "Xuất Excel thành công",
          data: result,
        });
      } catch (error: any) {
        logger.error("Error exporting Excel:", error);
        sendError({
          res,
          message: error.message || "Lỗi khi xuất Excel",
          statusCode: 500,
          errors: error.errors || [],
        });
      }
    },
  );

  /**
   * Tạo và trả về URL template Excel
   * GET /api/v1/excel/template/:entityType?storeId=xxx&filters={...}
   */
  getTemplate = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { entityType } = req.params;
        const { storeId, filters } = req.query;

        // Parse filters nếu có
        let parsedFilters;
        if (filters && typeof filters === "string") {
          try {
            parsedFilters = JSON.parse(filters);
          } catch (e) {
            parsedFilters = {};
          }
        }

        const result = await this.excelService.generateTemplate(req, {
          entityType: entityType as any,
          storeId: storeId as string,
          filters: parsedFilters,
        });

        sendResponse({
          res,
          data: result,
          message: "Template đã được tạo thành công",
        });
      } catch (error: any) {
        logger.error("Error generating template:", error);
        sendError({
          res,
          message: error.message || "Lỗi khi tạo template",
          statusCode: 500,
          errors: error.errors || [],
        });
      }
    },
  );

  /**
   * Import dữ liệu từ Excel
   * POST /api/v1/excel/import
   */
  import = asyncHandler(async (req: Request, res: Response) => {
    try {
      const options: ImportOptionsDto = req.body;

      // Validate file trước
      const validation = await this.excelService.validateImportFile(
        options.fileId,
        options.entityType,
      );
      if (!validation.valid) {
        return sendError({
          res,
          message: validation.message || "File không hợp lệ",
          statusCode: 400,
          errors: validation.errors,
        });
      }

      // Start background import job
      const { jobId } = await this.excelService.startImportJob(req, options);

      sendResponse({
        res,
        message: `Đã nhận yêu cầu import. Job ID: ${jobId}. Bạn sẽ nhận được thông báo qua socket khi hoàn tất.`,
        data: { jobId },
      });
    } catch (error: any) {
      logger.error("Error importing Excel:", error);
      sendError({
        res,
        message: error.message || "Lỗi khi import Excel",
        statusCode: 500,
        errors: error.errors || [],
      });
    }
  });

  /**
   * Get import job progress
   * GET /api/v1/excel/import/progress/:jobId
   */
  getImportProgress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { jobId } = req.params;

        const progress = this.excelService.getJobProgress(jobId);

        if (!progress) {
          return sendError({
            res,
            message: "Không tìm thấy job import",
            statusCode: 404,
          });
        }

        sendResponse({
          res,
          message: "Lấy tiến trình thành công",
          data: progress,
        });
      } catch (error: any) {
        logger.error("Error getting import progress:", error);
        sendError({
          res,
          message: error.message || "Lỗi khi lấy tiến trình import",
          statusCode: 500,
        });
      }
    },
  );

  /**
   * Stream import progress via SSE
   * GET /api/v1/excel/import/progress/:jobId/stream
   */
  streamImportProgress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { jobId } = req.params;

      // Setup SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

      // CORS for SSE with credentials
      const origin = req.headers.origin || "http://localhost:3000";
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");

      // Prevent timeout
      res.setTimeout(0);

      // Flush headers để browser nhận stream ngay lập tức
      if (res.flushHeaders) {
        res.flushHeaders();
      }

      console.log(
        `📡 [SSE] New connection for job: ${jobId} from origin: ${origin}`,
      );

      // Register this client with the service
      this.excelService.registerSSEClient(jobId, res);

      // Cleanup on client disconnect
      req.on("close", () => {
        console.log(`🔌 [SSE] Client disconnected from job: ${jobId}`);
      });
    },
  );

  /**
   * Validate file Excel trước khi import
   * POST /api/v1/excel/validate
   */
  validateFile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { fileId, entityType } = req.body;

        const result = await this.excelService.validateImportFile(
          fileId,
          entityType,
        );
        if (result.valid) {
          sendResponse({
            res,
            message: "File hợp lệ",
            data: result,
          });
        } else {
          sendError({
            res,
            message: result.message || "File không hợp lệ",
            statusCode: 400,
            errors: result.errors,
          });
        }
      } catch (error: any) {
        logger.error("Error validating file:", error);
        sendError({
          res,
          message: error.message || "Lỗi khi validate file Excel",
          errors: error.errors || [],
        });
      }
    },
  );
}
