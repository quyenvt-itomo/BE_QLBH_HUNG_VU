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
import {
  EXCEL_FILENAME_PREFIXES,
  EXCEL_TYPES,
  ExcelEntityType,
} from "./excel.types";
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
import { CustomerExcelTemplate } from "./customer/customer.excel.template";
import { CustomerExcelProcessor } from "./customer/customer.excel.processor";
import { SupplierExcelTemplate } from "./supplier/supplier.excel.template";
import { SupplierExcelProcessor } from "./supplier/supplier.excel.processor";

@injectable()
export class ExcelService {
  private importJobs = new Map<string, ImportJobProgress>();
  private sseClients = new Map<string, Response[]>();

  constructor(
    @inject(EXCEL_TYPES.ProductExcelTemplate)
    private productTemplate: ProductExcelTemplate,
    @inject(EXCEL_TYPES.ProductExcelProcessor)
    private productProcessor: ProductExcelProcessor,
    @inject(EXCEL_TYPES.CustomerExcelTemplate)
    private customerTemplate: CustomerExcelTemplate,
    @inject(EXCEL_TYPES.CustomerExcelProcessor)
    private customerProcessor: CustomerExcelProcessor,
    @inject(EXCEL_TYPES.SupplierExcelTemplate)
    private supplierTemplate: SupplierExcelTemplate,
    @inject(EXCEL_TYPES.SupplierExcelProcessor)
    private supplierProcessor: SupplierExcelProcessor,
    @inject(FILE_TYPES.FileService)
    private fileService: FileService,
  ) {}

  async exportData(
    req: RequestContext,
    options: ExportOptions,
  ): Promise<Buffer> {
    let workbook: ExcelJS.Workbook;
    if (options.entityType === ExcelEntityType.PRODUCT) {
      workbook = await this.productTemplate.exportData(
        req,
        options.columns || [],
        options.filters || {},
        options.extraUnitColumns || [],
        options.businessStoreColumns || [],
      );
    } else if (options.entityType === ExcelEntityType.CUSTOMER) {
      workbook = await this.customerTemplate.exportData(
        req,
        options.columns || [],
        options.filters || {},
        options.sheetColumns || {},
      );
    } else if (options.entityType === ExcelEntityType.SUPPLIER) {
      workbook = await this.supplierTemplate.exportData(
        req,
        options.columns || [],
        options.filters || {},
        options.sheetColumns || {},
      );
    } else {
      throw new BadRequestError("Excel chưa hỗ trợ loại dữ liệu này");
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  getDownloadFilename(
    filename?: string,
    entityType: ExcelEntityType = ExcelEntityType.PRODUCT,
  ): string {
    const clean = path.basename(String(filename || ""));
    if (!clean || clean === "." || clean === path.sep) {
      return `${EXCEL_FILENAME_PREFIXES[entityType].export}.xlsx`;
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
        ? this.getDownloadFilename(options.filename, options.entityType)
        : `${EXCEL_FILENAME_PREFIXES[options.entityType].export}_${uuidv4()}.xlsx`;
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
    const file = await this.fileService.getById(options.fileId);
    if (!file?.path) throw new NotFoundError("Không tìm thấy file import");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(
      path.isAbsolute(file.path)
        ? file.path
        : path.join(config.UPLOAD_DIR, file.path),
    );
    if (options.entityType === ExcelEntityType.PRODUCT) {
      return this.productProcessor.processImport(req, workbook, options, onProgress);
    }
    if (options.entityType === ExcelEntityType.CUSTOMER) {
      return this.customerProcessor.processImport(req, workbook, options, onProgress);
    }
    if (options.entityType === ExcelEntityType.SUPPLIER) {
      return this.supplierProcessor.processImport(req, workbook, options, onProgress);
    }
    throw new BadRequestError("Excel chưa hỗ trợ loại dữ liệu này");
  }

  async getTemplate(options: TemplateOptions): Promise<TemplateResult> {
    let workbook: ExcelJS.Workbook;
    if (options.entityType === ExcelEntityType.PRODUCT) {
      workbook = await this.productTemplate.generateTemplate();
    } else if (options.entityType === ExcelEntityType.CUSTOMER) {
      workbook = await this.customerTemplate.generateTemplate();
    } else if (options.entityType === ExcelEntityType.SUPPLIER) {
      workbook = await this.supplierTemplate.generateTemplate();
    } else {
      throw new BadRequestError("Excel chưa hỗ trợ loại dữ liệu này");
    }
    const templateDir = path.join(config.UPLOAD_DIR, "temp", "templates");
    await fs.mkdir(templateDir, { recursive: true });
    const filename =
      `${EXCEL_FILENAME_PREFIXES[options.entityType].template}_${uuidv4()}.xlsx`;
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
    res.write("retry: 3000\n\n");
    const heartbeat = setInterval(() => {
      try {
        res.write(": keep-alive\n\n");
        (res as any).flush?.();
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);
    res.on("close", () => {
      clearInterval(heartbeat);
      const current = this.sseClients.get(jobId);
      if (!current) return;
      const active = current.filter((client) => client !== res);
      if (active.length) this.sseClients.set(jobId, active);
      else this.sseClients.delete(jobId);
    });
    res.write("data: " + JSON.stringify(job) + "\n\n");
    (res as any).flush?.();
    if (job.status === "completed" || job.status === "failed") {
      clearInterval(heartbeat);
      res.end();
    }
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
