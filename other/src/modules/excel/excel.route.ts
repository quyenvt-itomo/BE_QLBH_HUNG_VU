import { Router } from "express";
import { injectable, inject } from "inversify";
import { ExcelController } from "./excel.controller";
import { EXCEL_TYPES } from "./excel.types";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  ExportOptionsSchema,
  ImportOptionsSchema,
  GetTemplateParamsSchema,
  GetTemplateQuerySchema,
} from "./excel.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class ExcelRouter {
  private router: Router;

  constructor(
    @inject(EXCEL_TYPES.ExcelController)
    private excelController: ExcelController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /api/v1/excel/export - Export dữ liệu ra Excel
    this.router.post(
      "/export",
      zodValidate(ExportOptionsSchema, "body"),
      // permissionMiddleware("product", "export"), // TODO: Add excel permission
      this.excelController.export,
    );

    // GET /api/v1/excel/template/:entityType - Tạo và trả về URL template
    this.router.get(
      "/template/:entityType",
      zodValidate(GetTemplateParamsSchema, "params"),
      zodValidate(GetTemplateQuerySchema, "query"),
      this.excelController.getTemplate,
    );

    // POST /api/v1/excel/import - Import dữ liệu từ Excel (background job)
    this.router.post(
      "/import",
      zodValidate(ImportOptionsSchema, "body"),
      // permissionMiddleware("product", "import"), // TODO: Add excel permission
      this.excelController.import,
    );

    // GET /api/v1/excel/import/progress/:jobId - Lấy tiến trình import
    this.router.get(
      "/import/progress/:jobId",
      this.excelController.getImportProgress,
    );

    // GET /api/v1/excel/import/progress/:jobId/stream - Stream import progress via SSE
    this.router.get(
      "/import/progress/:jobId/stream",
      this.excelController.streamImportProgress,
    );

    // POST /api/v1/excel/validate - Validate file Excel
    this.router.post("/validate", this.excelController.validateFile);
  }

  public getRouter(): Router {
    return this.router;
  }
}
