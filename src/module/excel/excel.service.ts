import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "@/config/env";
import {
  ExcelEntityType,
  ExportOptions,
  ExportExcelResult,
  ImportOptions,
  ImportResult,
  ImportJobProgress,
  TemplateOptions,
  TemplateResult,
  EXCEL_TYPES,
  ENTITY_SUPPORTS_IMPORT,
} from "./excel.types";
import { PartnerExcelTemplate } from "./partner/partner.excel.template";
import { PartnerExcelProcessor } from "./partner/partner.excel.processor";
import { EmployeeExcelTemplate } from "./employee/employee.excel.template";
import { EmployeeExcelProcessor } from "./employee/employee.excel.processor";
import { UserExcelTemplate } from "./user/user.excel.template";
import { UserExcelProcessor } from "./user/user.excel.processor";
import { ProductExcelTemplate } from "./product/product.excel.template";
import { ProductExcelProcessor } from "./product/product.excel.processor";
import { ServiceExcelTemplate } from "./service/service.excel.template";
import { ServiceExcelProcessor } from "./service/service.excel.processor";
import { JobPositionExcelTemplate } from "./jobPosition/jobPosition.excel.template";
import { JobPositionExcelProcessor } from "./jobPosition/jobPosition.excel.processor";
import { WarehouseExcelTemplate } from "./warehouse/warehouse.excel.template";
import { WarehouseExcelProcessor } from "./warehouse/warehouse.excel.processor";
import { PriceHistoryExcelTemplate } from "./priceHistory/priceHistory.excel.template";
import { FILE_TYPES } from "../file/file.types";
import { FileService } from "../file/file.service";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";
import { Response } from "express";

@injectable()
export class ExcelService {
  private importJobs: Map<string, ImportJobProgress> = new Map();
  private sseClients: Map<string, Response[]> = new Map();

  constructor(
    @inject(EXCEL_TYPES.PartnerExcelTemplate)
    private partnerTemplate: PartnerExcelTemplate,
    @inject(EXCEL_TYPES.PartnerExcelProcessor)
    private partnerProcessor: PartnerExcelProcessor,
    @inject(EXCEL_TYPES.EmployeeExcelTemplate)
    private employeeTemplate: EmployeeExcelTemplate,
    @inject(EXCEL_TYPES.EmployeeExcelProcessor)
    private employeeProcessor: EmployeeExcelProcessor,
    @inject(EXCEL_TYPES.UserExcelTemplate)
    private userTemplate: UserExcelTemplate,
    @inject(EXCEL_TYPES.UserExcelProcessor)
    private userProcessor: UserExcelProcessor,
    @inject(EXCEL_TYPES.ProductExcelTemplate)
    private productTemplate: ProductExcelTemplate,
    @inject(EXCEL_TYPES.ProductExcelProcessor)
    private productProcessor: ProductExcelProcessor,
    @inject(EXCEL_TYPES.ServiceExcelTemplate)
    private serviceTemplate: ServiceExcelTemplate,
    @inject(EXCEL_TYPES.ServiceExcelProcessor)
    private serviceProcessor: ServiceExcelProcessor,
    @inject(EXCEL_TYPES.JobPositionExcelTemplate)
    private jobPositionTemplate: JobPositionExcelTemplate,
    @inject(EXCEL_TYPES.JobPositionExcelProcessor)
    private jobPositionProcessor: JobPositionExcelProcessor,
    @inject(EXCEL_TYPES.WarehouseExcelTemplate)
    private warehouseTemplate: WarehouseExcelTemplate,
    @inject(EXCEL_TYPES.WarehouseExcelProcessor)
    private warehouseProcessor: WarehouseExcelProcessor,
    @inject(EXCEL_TYPES.PriceHistoryExcelTemplate)
    private priceHistoryTemplate: PriceHistoryExcelTemplate,
    @inject(FILE_TYPES.FileService)
    private fileService: FileService,
  ) {}

  // ======================== EXPORT ========================

  async exportData(
    req: RequestContext,
    options: ExportOptions,
  ): Promise<Buffer> {
    const { filters = {}, columns = [], branchId } = options;
    const appliedFilters = { ...filters, branchId };

    let workbook: ExcelJS.Workbook;
    switch (options.entityType) {
      case ExcelEntityType.PARTNER:
        workbook = await this.partnerTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;
      case ExcelEntityType.EMPLOYEE:
        workbook = await this.employeeTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;
      case ExcelEntityType.USER:
        workbook = await this.userTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;
      case ExcelEntityType.PRODUCT:
        workbook = await this.productTemplate.exportData(
          req,
          columns,
          appliedFilters,
          options.extraUnitColumns,
        );
        break;
      case ExcelEntityType.SERVICE:
        workbook = await this.serviceTemplate.exportData(
          req,
          columns,
          appliedFilters,
          options.extraUnitColumns,
        );
        break;
      case ExcelEntityType.JOB_POSITION:
        workbook = await this.jobPositionTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;
      case ExcelEntityType.WAREHOUSE:
        workbook = await this.warehouseTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;
      case ExcelEntityType.PRICE_HISTORY:
        workbook = await this.priceHistoryTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;
      default:
        throw new BadRequestError(
          `Không hỗ trợ export cho loại: ${options.entityType}`,
        );
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  async exportToFile(
    req: RequestContext,
    options: ExportOptions,
  ): Promise<ExportExcelResult> {
    const buffer = await this.exportData(req, options);

    const exportDir = path.join(
      config.UPLOAD_DIR || "uploads",
      "temp",
      "exports",
    );
    await fs.mkdir(exportDir, { recursive: true });

    const filename =
      options.filename || `${options.entityType}_${uuidv4()}.xlsx`;
    const filePath = path.join(exportDir, filename);
    await fs.writeFile(filePath, buffer);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return { url: `/uploads/temp/exports/${filename}`, filename, expiresAt };
  }

  // ======================== IMPORT ========================

  async importData(
    req: RequestContext,
    options: ImportOptions,
  ): Promise<ImportResult> {
    if (!ENTITY_SUPPORTS_IMPORT[options.entityType]) {
      throw new BadRequestError(
        `Loại '${options.entityType}' không hỗ trợ import`,
      );
    }

    const fileRecord = await this.fileService.getById(options.fileId);
    if (!fileRecord) throw new NotFoundError("Không tìm thấy file import");

    let filePath = fileRecord.path || "";
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(config.UPLOAD_DIR || "uploads", filePath);
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    switch (options.entityType) {
      case ExcelEntityType.PARTNER:
        return this.partnerProcessor.processImport(req, workbook, options);
      case ExcelEntityType.EMPLOYEE:
        return this.employeeProcessor.processImport(req, workbook, options);
      case ExcelEntityType.USER:
        return this.userProcessor.processImport(req, workbook, options);
      case ExcelEntityType.PRODUCT:
        return this.productProcessor.processImport(req, workbook, options);
      case ExcelEntityType.SERVICE:
        return this.serviceProcessor.processImport(req, workbook, options);
      case ExcelEntityType.JOB_POSITION:
        return this.jobPositionProcessor.processImport(req, workbook, options);
      case ExcelEntityType.WAREHOUSE:
        return this.warehouseProcessor.processImport(req, workbook, options);
      default:
        throw new BadRequestError(
          `Không hỗ trợ import cho loại: ${options.entityType}`,
        );
    }
  }

  // ======================== TEMPLATE ========================

  async getTemplate(options: TemplateOptions): Promise<TemplateResult> {
    let workbook: ExcelJS.Workbook;
    switch (options.entityType) {
      case ExcelEntityType.PARTNER:
        workbook = await this.partnerTemplate.generateTemplate(
          options.branchId,
        );
        break;
      case ExcelEntityType.EMPLOYEE:
        workbook = await this.employeeTemplate.generateTemplate(
          options.branchId,
        );
        break;
      case ExcelEntityType.USER:
        workbook = await this.userTemplate.generateTemplate(options.branchId);
        break;
      case ExcelEntityType.PRODUCT:
        workbook = await this.productTemplate.generateTemplate(
          options.branchId,
        );
        break;
      case ExcelEntityType.SERVICE:
        workbook = await this.serviceTemplate.generateTemplate(
          options.branchId,
        );
        break;
      case ExcelEntityType.JOB_POSITION:
        workbook = await this.jobPositionTemplate.generateTemplate(
          options.branchId,
        );
        break;
      case ExcelEntityType.WAREHOUSE:
        workbook = await this.warehouseTemplate.generateTemplate(
          options.branchId,
        );
        break;
      case ExcelEntityType.PRICE_HISTORY:
        workbook = await this.priceHistoryTemplate.generateTemplate(
          options.branchId,
        );
        break;
      default:
        throw new BadRequestError(
          `Không hỗ trợ template cho loại: ${options.entityType}`,
        );
    }

    const templateDir = path.join(
      config.UPLOAD_DIR || "uploads",
      "temp",
      "templates",
    );
    await fs.mkdir(templateDir, { recursive: true });

    const filename = `template_${options.entityType}_${uuidv4()}.xlsx`;
    const filePath = path.join(templateDir, filename);
    await workbook.xlsx.writeFile(filePath);

    return {
      url: `/uploads/temp/templates/${filename}`,
      filename,
      entityType: options.entityType,
    };
  }

  // ======================== ASYNC JOB + SSE ========================

  async startImportJob(
    req: RequestContext,
    options: ImportOptions,
  ): Promise<{ jobId: string }> {
    const jobId = uuidv4();
    const job: ImportJobProgress = {
      jobId,
      status: "pending",
      progress: 0,
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
      layers: [],
    };
    this.importJobs.set(jobId, job);

    this.processImportInBackground(req, options, jobId).catch((err) => {
      logger.error(`[Excel Import Job ${jobId}] Failed:`, err);
    });

    return { jobId };
  }

  getJobProgress(jobId: string): ImportJobProgress | undefined {
    return this.importJobs.get(jobId);
  }

  addSseClient(jobId: string, res: Response): void {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const clients = this.sseClients.get(jobId) || [];
    clients.push(res);
    this.sseClients.set(jobId, clients);

    res.on("close", () => {
      const list = this.sseClients.get(jobId) || [];
      this.sseClients.set(
        jobId,
        list.filter((c) => c !== res),
      );
    });
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
      job.progress = 10;
      this.notifyProgress(jobId);

      const result = await this.importData(req, options);

      job.totalRows = result.totalRows;
      job.successRows = result.successRows;
      job.errorRows = result.errorRows;
      job.skippedRows = result.skippedRows;
      job.errors = result.errors;
      job.data = result.data;
      job.status = "completed";
      job.progress = 100;
      this.notifyProgress(jobId);
    } catch (error: any) {
      job.status = "failed";
      job.errors.push({ row: 0, message: error.message || "Unknown error" });
      this.notifyProgress(jobId);
    }
  }

  private notifyProgress(jobId: string): void {
    const job = this.importJobs.get(jobId);
    if (!job) return;

    const clients = this.sseClients.get(jobId) || [];
    const data = JSON.stringify(job);
    for (const client of clients) {
      client.write(`data: ${data}\n\n`);
    }
    if (job.status === "completed" || job.status === "failed") {
      this.sseClients.delete(jobId);
    }
  }
}
