import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";
import { config } from "@/config/env";
import { FileService } from "../file/file.service";
import { FILE_TYPES } from "../file/file.types";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { EXCEL_TYPES, ExcelEntityType } from "./excel.types";
import {
  ExportOptions,
  ExportExcelResult,
  ImportOptions,
  ImportResult,
  ImportJobProgress,
  ImportProgressCallback,
  TemplateOptions,
  TemplateResult,
} from "./excel.types";
import { ProductExcelTemplate } from "./product/product.excel.template";
import { ProductExcelProcessor } from "./product/product.excel.processor";

@injectable()
export class ExcelService {
  private importJobs = new Map<string, ImportJobProgress>();
  private sseClients = new Map<string, Response[]>();

  constructor(
    @inject(EXCEL_TYPES.ProductExcelTemplate)
    private productTemplate: ProductExcelTemplate,
    @inject(EXCEL_TYPES.ProductExcelProcessor)
    private productProcessor: ProductExcelProcessor,
    @inject(FILE_TYPES.FileService)
    private fileService: FileService,
  ) {}

  async exportData(
    req: RequestContext,
    options: ExportOptions,
  ): Promise<Buffer> {
    if (options.entityType !== ExcelEntityType.PRODUCT) {
      throw new BadRequestError("Excel hiện chỉ hỗ trợ hàng hóa");
    }
    const workbook = await this.productTemplate.exportData(
      req,
      options.columns || [],
      options.filters || {},
      options.extraUnitColumns || [],
      options.businessStoreColumns || [],
    );
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  getDownloadFilename(filename?: string): string {
    const clean = path.basename(String(filename || ""));
    if (!clean || clean === "." || clean === path.sep) {
      return "product.xlsx";
    }
    return clean.toLowerCase().endsWith(".xlsx") ? clean : clean + ".xlsx";
  }

  async exportToFile(
    req: RequestContext,
    options: ExportOptions,
  ): Promise<ExportExcelResult> {
    const buffer = await this.exportData(req, options);
    const exportDir = path.join(config.UPLOAD_DIR, "temp", "exports");
    await fs.mkdir(exportDir, { recursive: true });
    const filename =
      options.filename && options.filename.trim()
        ? this.getDownloadFilename(options.filename)
        : "product_" + uuidv4() + ".xlsx";
    await fs.writeFile(path.join(exportDir, filename), buffer);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return {
      url: "/uploads/temp/exports/" + filename,
      filename,
      expiresAt,
    };
  }

  async importData(
    req: RequestContext,
    options: ImportOptions,
    onProgress?: ImportProgressCallback,
  ): Promise<ImportResult> {
    if (options.entityType !== ExcelEntityType.PRODUCT) {
      throw new BadRequestError("Excel hiện chỉ hỗ trợ hàng hóa");
    }
    const file = await this.fileService.getById(options.fileId);
    if (!file?.path) throw new NotFoundError("Không tìm thấy file import");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(
      path.isAbsolute(file.path)
        ? file.path
        : path.join(config.UPLOAD_DIR, file.path),
    );
    return this.productProcessor.processImport(
      req,
      workbook,
      options,
      onProgress,
    );
  }

  async getTemplate(options: TemplateOptions): Promise<TemplateResult> {
    if (options.entityType !== ExcelEntityType.PRODUCT) {
      throw new BadRequestError("Excel hiện chỉ hỗ trợ hàng hóa");
    }
    const workbook = await this.productTemplate.generateTemplate();
    const templateDir = path.join(config.UPLOAD_DIR, "temp", "templates");
    await fs.mkdir(templateDir, { recursive: true });
    const filename = "template_product_" + uuidv4() + ".xlsx";
    await workbook.xlsx.writeFile(path.join(templateDir, filename));
    return {
      url: "/uploads/temp/templates/" + filename,
      filename,
      entityType: options.entityType,
    };
  }

  async startImportJob(
    req: RequestContext,
    options: ImportOptions,
  ): Promise<{ jobId: string }> {
    const jobId = uuidv4();
    this.importJobs.set(jobId, {
      jobId,
      status: "pending",
      progress: 0,
      totalRows: 0,
      processedRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
      layers: [],
    });
    void this.processImportInBackground(req, options, jobId);
    return { jobId };
  }

  private async processImportInBackground(
    req: RequestContext,
    options: ImportOptions,
    jobId: string,
  ): Promise<void> {
    const job = this.importJobs.get(jobId);
    if (!job) return;
    try {
      job.status = "processing";
      job.progress = 5;
      this.notifyProgress(jobId);
      const result = await this.importData(req, options, (update) => {
        job.totalRows = update.totalRows;
        job.processedRows = update.processedRows;
        job.successRows = update.successRows;
        job.errorRows = update.errorRows;
        job.skippedRows = update.skippedRows;
        job.progress = update.totalRows
          ? Math.min(99, 5 + Math.round(update.processedRows / update.totalRows * 90))
          : 5;
        this.notifyProgress(jobId);
      });
      Object.assign(job, result, {
        status: "completed",
        progress: 100,
        processedRows: result.totalRows,
      });
      this.notifyProgress(jobId);
    } catch (error: any) {
      job.status = "failed";
      job.errors.push({ row: 0, message: error?.message || "Import thất bại" });
      this.notifyProgress(jobId);
    }
  }

  getJobProgress(jobId: string): ImportJobProgress | undefined {
    return this.importJobs.get(jobId);
  }

  registerSSEClient(jobId: string, res: Response): void {
    const job = this.importJobs.get(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    const clients = this.sseClients.get(jobId) || [];
    clients.push(res);
    this.sseClients.set(jobId, clients);
    res.on("close", () => {
      const current = this.sseClients.get(jobId);
      if (!current) return;
      const active = current.filter((client) => client !== res);
      if (active.length) this.sseClients.set(jobId, active);
      else this.sseClients.delete(jobId);
    });
    res.write("data: " + JSON.stringify(job) + "\n\n");
    (res as any).flush?.();
    if (job.status === "completed" || job.status === "failed") res.end();
  }

  private notifyProgress(jobId: string): void {
    const job = this.importJobs.get(jobId);
    const clients = this.sseClients.get(jobId);
    if (!job || !clients?.length) return;
    const active: Response[] = [];
    for (const client of clients) {
      try {
        client.write("data: " + JSON.stringify(job) + "\n\n");
        (client as any).flush?.();
        if (job.status !== "completed" && job.status !== "failed") active.push(client);
        else client.end();
      } catch {
        // Client đã ngắt kết nối.
      }
    }
    if (active.length) this.sseClients.set(jobId, active);
    else this.sseClients.delete(jobId);
  }
}
