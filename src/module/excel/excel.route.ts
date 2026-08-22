import { Router } from "express";
import { injectable, inject } from "inversify";
import { ExcelController } from "./excel.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  ExportOptionsSchema,
  ImportOptionsSchema,
  GetTemplateParamsSchema,
  GetTemplateQuerySchema,
} from "./excel.validator";
import { EXCEL_TYPES } from "./excel.types";
import { excelPermissionMiddleware } from "./excel.permission";

@injectable()
export class ExcelRouter {
  private router: Router;

  constructor(
    @inject(EXCEL_TYPES.ExcelController)
    private controller: ExcelController,
  ) {
    this.router = Router();
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
      this.controller.getTemplate,
    );

    this.router.get("/job/:jobId", this.controller.getJobProgress);

    this.router.get(
      "/import/progress/:jobId/stream",
      this.controller.streamProgress,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
