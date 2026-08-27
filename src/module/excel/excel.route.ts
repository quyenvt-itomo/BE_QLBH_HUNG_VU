import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { EXCEL_TYPES } from "./excel.types";
import { ExcelController } from "./excel.controller";
import {
  ExportOptionsSchema,
  GetTemplateParamsSchema,
  GetTemplateQuerySchema,
  ImportOptionsSchema,
} from "./excel.validator";
import { excelPermissionMiddleware } from "./excel.permission";

@injectable()
export class ExcelRouter {
  private router = Router();

  constructor(
    @inject(EXCEL_TYPES.ExcelController)
    private controller: ExcelController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/export",
      zodValidate(ExportOptionsSchema, "body"),
      excelPermissionMiddleware("export"),
      this.controller.export,
    );
    this.router.post(
      "/download",
      zodValidate(ExportOptionsSchema, "body"),
      excelPermissionMiddleware("export"),
      this.controller.download,
    );
    this.router.post(
      "/import",
      zodValidate(ImportOptionsSchema, "body"),
      excelPermissionMiddleware("import"),
      this.controller.import,
    );
    this.router.get(
      "/template/:entityType",
      zodValidate(GetTemplateParamsSchema, "params"),
      zodValidate(GetTemplateQuerySchema, "query"),
      excelPermissionMiddleware("import"),
      this.controller.getTemplate,
    );
    this.router.get(
      "/job/:jobId",
      excelPermissionMiddleware("import"),
      this.controller.getJobProgress,
    );
    this.router.get(
      "/import/progress/:jobId/stream",
      excelPermissionMiddleware("import"),
      this.controller.streamProgress,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
