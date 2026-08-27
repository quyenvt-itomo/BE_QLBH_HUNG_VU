import { inject, injectable } from "inversify";
import { Request, Response } from "express";
import { asyncHandler, sendResponse } from "@/shared/utils/controller.utils";
import { BadRequestError } from "@/shared/types/errors";
import { EXCEL_TYPES } from "./excel.types";
import { ExcelService } from "./excel.service";

@injectable()
export class ExcelController {
  constructor(
    @inject(EXCEL_TYPES.ExcelService)
    private excelService: ExcelService,
  ) {}

  export = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.excelService.exportToFile(req as any, req.body);
    sendResponse({ res, data: result });
  });

  download = asyncHandler(async (req: Request, res: Response) => {
    const buffer = await this.excelService.exportData(req as any, req.body);
    const filename = this.excelService.getDownloadFilename(req.body.filename);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + encodeURIComponent(filename) + '"',
    );
    res.send(buffer);
  });

  import = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.excelService.startImportJob(req as any, req.body);
    sendResponse({ res, data: result });
  });

  getTemplate = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.excelService.getTemplate({
      entityType: req.params.entityType as any,
    });
    sendResponse({ res, data: result });
  });

  getJobProgress = asyncHandler(async (req: Request, res: Response) => {
    const job = this.excelService.getJobProgress(req.params.jobId);
    if (!job) throw new BadRequestError("Không tìm thấy job import");
    sendResponse({ res, data: job });
  });

  streamProgress = (req: Request, res: Response): void => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setTimeout(0);
    res.flushHeaders();
    this.excelService.registerSSEClient(req.params.jobId, res);
  };
}
