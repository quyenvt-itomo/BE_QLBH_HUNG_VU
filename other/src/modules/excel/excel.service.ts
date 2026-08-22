import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  ExcelEntityType,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ImportJobProgress,
  TemplateOptions,
  TemplateResult,
  EXCEL_TYPES,
} from "./excel.types";
import { ProductExcelTemplate } from "./product/product.template";
import { ProductExcelProcessor } from "./product/product.processor";
import { CustomerExcelTemplate } from "./customer/customer.template";
import { CustomerExcelProcessor } from "./customer/customer.processor";
import { FILE_TYPES, FileService } from "@/modules/file";
import { IError, NotFoundError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import logger from "@/shared/utils/logger";
import { SocketUtils } from "@/shared/utils/socket.utils";
import { SaleOrderExcelTemplate } from "./saleOrder/saleOrder.template";
import { SaleOrderExcelProcessor } from "./saleOrder/saleOrder.processor";
import { InventoryReportExcelTemplate } from "./inventoryReport/inventoryReport.template";
import { InventoryAdjustmentExcelTemplate } from "./inventoryAdjustment/inventoryAdjustment.template";
import { DashboardExcelTemplate } from "./dashboard/dashboard.template";
import { IncomeExpenseExcelTemplate } from "./incomeExpense/incomeExpense.template";
import {
  DASHBOARD_COLUMNS_META,
  DashboardColumnsMeta,
} from "./dashboard/dashboard.types";

/**
 * Excel Service
 * Core service để xử lý export/import Excel
 */
@injectable()
export class ExcelService {
  // In-memory storage cho import jobs
  private importJobs: Map<string, ImportJobProgress> = new Map();
  // SSE clients for each job
  private sseClients: Map<string, Response[]> = new Map();

  constructor(
    @inject(EXCEL_TYPES.ProductExcelTemplate)
    private productTemplate: ProductExcelTemplate,
    @inject(EXCEL_TYPES.ProductExcelProcessor)
    private productProcessor: ProductExcelProcessor,
    @inject(EXCEL_TYPES.CustomerExcelTemplate)
    private customerTemplate: CustomerExcelTemplate,
    @inject(EXCEL_TYPES.CustomerExcelProcessor)
    private customerProcessor: CustomerExcelProcessor,
    @inject(EXCEL_TYPES.SaleOrderExcelTemplate)
    private saleOrderTemplate: SaleOrderExcelTemplate,
    @inject(EXCEL_TYPES.InventoryAdjustmentExcelTemplate)
    private inventoryAdjustmentTemplate: InventoryAdjustmentExcelTemplate,
    @inject(EXCEL_TYPES.InventoryReportExcelTemplate)
    private inventoryReportTemplate: InventoryReportExcelTemplate,
    @inject(EXCEL_TYPES.SaleOrderExcelProcessor)
    private saleOrderProcessor: SaleOrderExcelProcessor,
    @inject(EXCEL_TYPES.DashboardExcelTemplate)
    private dashboardTemplate: DashboardExcelTemplate,
    @inject(EXCEL_TYPES.IncomeExpenseExcelTemplate)
    private incomeExpenseTemplate: IncomeExpenseExcelTemplate,
    @inject(FILE_TYPES.FileService)
    private fileService: FileService,
  ) {}

  /**
   * Export dữ liệu ra Excel
   */
  async exportData(req: Request, options: ExportOptions): Promise<any> {
    let workbook: ExcelJS.Workbook;
    const { filters = {}, columns = [], storeId } = options;

    const appliedFilters = { ...filters };

    if (storeId) {
      appliedFilters.storeId = storeId;
    }

    switch (options.entityType) {
      case ExcelEntityType.PRODUCT:
        workbook = await this.productTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      case ExcelEntityType.CUSTOMER:
        workbook = await this.customerTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      case ExcelEntityType.SALE_ORDER:
        workbook = await this.saleOrderTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      case ExcelEntityType.INVENTORY_ADJUSTMENT:
        workbook = await this.inventoryAdjustmentTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      case ExcelEntityType.INVENTORY_REPORT:
        workbook = await this.inventoryReportTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      case ExcelEntityType.DASHBOARD:
        workbook = await this.dashboardTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      case ExcelEntityType.INCOME_EXPENSE:
        workbook = await this.incomeExpenseTemplate.exportData(
          req,
          columns,
          appliedFilters,
        );
        break;

      // Có thể thêm các entity khác
      default:
        throw new Error(
          `Entity type '${options.entityType}' không được hỗ trợ`,
        );
    }

    // Convert workbook to buffer
    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Export dữ liệu ra file Excel và trả về URL
   */
  async exportToFile(
    req: Request,
    options: ExportOptions,
  ): Promise<{ url: string; filename: string; expiresAt: Date }> {
    // Generate buffer
    const buffer = await this.exportData(req, options);

    // Tạo filename
    const filename =
      options.filename || `${options.entityType}_export_${Date.now()}.xlsx`;

    // Ghi file vào uploads/temp/exports
    const tempDir = path.join(process.cwd(), "uploads", "temp", "exports");
    await fs.mkdir(tempDir, { recursive: true });

    const filePath = path.join(tempDir, filename);
    await fs.writeFile(filePath, buffer);

    // Tạo URL để tải
    const url = `/uploads/temp/exports/${filename}`;

    // File sẽ tự động xóa sau 1 giờ bởi autoClearTemp job
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return {
      url,
      filename,
      expiresAt,
    };
  }

  /**
   * Tạo template Excel để import
   * Trả về URL thay vì buffer để hỗ trợ template động
   */
  async generateTemplate(
    req: Request,
    options: TemplateOptions,
  ): Promise<TemplateResult> {
    let workbook: ExcelJS.Workbook;
    const { entityType, storeId, filters } = options;

    switch (entityType) {
      case ExcelEntityType.PRODUCT:
        // Product template có thể static hoặc dynamic
        workbook = await this.productTemplate.generateTemplate();
        break;

      case ExcelEntityType.CUSTOMER:
        // Customer template
        workbook = await this.customerTemplate.generateTemplate();
        break;

      case ExcelEntityType.SALE_ORDER:
        workbook = await this.saleOrderTemplate.generateTemplate();
        break;

      default:
        throw new Error(`Entity type '${entityType}' không được hỗ trợ`);
    }

    // Lưu workbook vào temp folder
    const filename = `${entityType}_template_${Date.now()}.xlsx`;
    const tempDir = path.join(process.cwd(), "uploads", "temp", "templates");

    // Tạo folder nếu chưa có
    await fs.mkdir(tempDir, { recursive: true });

    const filePath = path.join(tempDir, filename);
    await workbook.xlsx.writeFile(filePath);

    // Tạo URL để tải
    const url = `/uploads/temp/templates/${filename}`;

    // Template file sẽ tự động xóa sau 1 giờ bởi autoClearTemp job
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return {
      url,
      filename,
      expiresAt,
    };
  }

  /**
   * Import dữ liệu từ Excel - Khởi tạo background job
   */
  async startImportJob(
    req: Request,
    options: ImportOptions,
  ): Promise<{ jobId: string }> {
    // 1. Validate file tồn tại
    const file = await this.fileService.findById(options.fileId);
    if (!file) {
      throw new NotFoundError("File không tồn tại");
    }

    // 2. Tạo jobId
    const jobId = uuidv4();

    // 3. Khởi tạo job progress
    const jobProgress: ImportJobProgress = {
      jobId,
      status: "pending",
      progress: 0,
      totalRows: 0,
      processedRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      startedAt: new Date(),
    };

    this.importJobs.set(jobId, jobProgress);

    // 4. Chạy import trong background
    this.processImportInBackground(req, jobId, options).catch((error) => {
      const job = this.importJobs.get(jobId);
      if (job) {
        job.status = "failed";
        job.completedAt = new Date();
        job.errors.push({
          row: 0,
          message: error.message || "Lỗi không xác định",
        });
        this.notifyProgress(req, jobId);
      }
    });

    // 5. Trả về jobId ngay lập tức
    return { jobId };
  }

  /**
   * Get job progress
   */
  getJobProgress(jobId: string): ImportJobProgress | null {
    return this.importJobs.get(jobId) || null;
  }

  /**
   * Register SSE client for a job
   */
  registerSSEClient(jobId: string, res: Response): void {
    const job = this.importJobs.get(jobId);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (!this.sseClients.has(jobId)) {
      this.sseClients.set(jobId, []);
    }
    this.sseClients.get(jobId)!.push(res);

    // console.log(`📡 [SSE] Client connected to job ${jobId}`);

    // Send current progress immediately
    const progressData: any = {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successRows: job.successRows,
      errorRows: job.errorRows,
      skippedRows: job.skippedRows,
      errors: job.errors.slice(-10),
    };

    // Chỉ gửi errorFileUrl trong message cuối cùng
    if (
      (job.status === "completed" || job.status === "failed") &&
      job.result?.errorFileUrl
    ) {
      progressData.errorFileUrl = job.result.errorFileUrl;
    }

    const data = JSON.stringify(progressData);

    res.write(`data: ${data}\n\n`);
    // Force flush buffer to send immediately
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }

    // Close if already completed
    if (job.status === "completed" || job.status === "failed") {
      res.end();
      // console.log(
      //   `🔌 [SSE] Job ${jobId} already completed, closing connection`,
      // );
    }
  }

  /**
   * Process import trong background với progress tracking
   */
  private async processImportInBackground(
    req: Request,
    jobId: string,
    options: ImportOptions,
  ): Promise<void> {
    const job = this.importJobs.get(jobId);
    if (!job) return;

    try {
      job.status = "processing";
      this.notifyProgress(req, jobId);

      // 1. Lấy file
      const file = await this.fileService.findById(options.fileId);
      if (!file) {
        throw new NotFoundError("File không tồn tại");
      }

      // 2. Đọc file Excel
      const filePath = path.isAbsolute(file.path)
        ? file.path
        : path.join(process.cwd(), file.path);

      await fs.access(filePath);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // 3. Process import với progress callback
      let result: ImportResult;

      switch (options.entityType) {
        case ExcelEntityType.PRODUCT:
          // Track last emitted state để chỉ notify khi có thay đổi
          let lastProductEmitKey = "";

          result = await this.productProcessor.processImportWithProgress(
            req,
            workbook,
            options,
            (progress) => {
              job.totalRows = progress.totalRows;
              job.processedRows =
                progress.successRows +
                progress.errorRows +
                progress.skippedRows;
              job.successRows = progress.successRows;
              job.errorRows = progress.errorRows;
              job.skippedRows = progress.skippedRows;
              job.errors = progress.errors;

              // Update layers (nếu processor support)
              job.layers = progress.layers;

              // Overall progress chỉ là binary: 0 (processing) hoặc 100 (done)
              if (progress.layers && progress.layers.length > 0) {
                const allCompleted = progress.layers.every(
                  (l) => l.status === "completed" || l.status === "failed",
                );
                job.progress = allCompleted ? 100 : 0;
              } else {
                job.progress =
                  job.totalRows > 0
                    ? Math.round((job.processedRows / job.totalRows) * 100)
                    : 0;
              }

              // Chỉ notify nếu có thay đổi
              const currentKey =
                progress.layers
                  ?.map((l) => `${l.label}:${l.progress}:${l.status}`)
                  .join("|") || `${job.progress}`;

              if (currentKey !== lastProductEmitKey) {
                lastProductEmitKey = currentKey;
                this.notifyProgress(req, jobId);
              }
            },
          );
          break;

        case ExcelEntityType.CUSTOMER:
          // Track last emitted state để chỉ notify khi có thay đổi
          let lastCustomerEmitKey = "";

          result = await this.customerProcessor.processImportWithProgress(
            req,
            workbook,
            options,
            (progress) => {
              job.totalRows = progress.totalRows;
              job.processedRows =
                progress.successRows +
                progress.errorRows +
                progress.skippedRows;
              job.successRows = progress.successRows;
              job.errorRows = progress.errorRows;
              job.skippedRows = progress.skippedRows;
              job.errors = progress.errors;

              // Update layers (forward từ processor)
              job.layers = progress.layers;

              // Overall progress chỉ là binary: 0 (processing) hoặc 100 (done)
              // Frontend sẽ hiển thị chi tiết từ layers array
              if (progress.layers && progress.layers.length > 0) {
                const allCompleted = progress.layers.every(
                  (l) => l.status === "completed" || l.status === "failed",
                );
                job.progress = allCompleted ? 100 : 0;
              } else {
                // Fallback nếu không có layers
                job.progress =
                  job.totalRows > 0
                    ? Math.round((job.processedRows / job.totalRows) * 100)
                    : 0;
              }

              // Chỉ notify nếu có thay đổi
              const currentKey =
                progress.layers
                  ?.map((l) => `${l.label}:${l.progress}:${l.status}`)
                  .join("|") || "";

              if (currentKey !== lastCustomerEmitKey) {
                lastCustomerEmitKey = currentKey;
                this.notifyProgress(req, jobId);
              }
            },
          );
          break;

        case ExcelEntityType.SALE_ORDER:
          let lastSaleOrderEmitKey = "";

          result = await this.saleOrderProcessor.processImportWithProgress(
            req,
            workbook,
            options,
            (progress) => {
              job.totalRows = progress.totalRows;
              job.processedRows =
                progress.successRows +
                progress.errorRows +
                progress.skippedRows;
              job.successRows = progress.successRows;
              job.errorRows = progress.errorRows;
              job.skippedRows = progress.skippedRows;
              job.errors = progress.errors;
              job.layers = progress.layers;
              if (progress.layers && progress.layers.length > 0) {
                const allCompleted = progress.layers.every(
                  (l) => l.status === "completed" || l.status === "failed",
                );
                job.progress = allCompleted ? 100 : 0;
              } else {
                job.progress =
                  job.totalRows > 0
                    ? Math.round((job.processedRows / job.totalRows) * 100)
                    : 0;
              }
              const currentKey =
                progress.layers
                  ?.map((l) => `${l.label}:${l.progress}:${l.status}`)
                  .join("|") || "";
              if (currentKey !== lastSaleOrderEmitKey) {
                lastSaleOrderEmitKey = currentKey;
                this.notifyProgress(req, jobId);
              }
            },
          );
          break;

        default:
          throw new Error(
            `Entity type '${options.entityType}' không được hỗ trợ`,
          );
      }

      // 4. Generate error file if there are errors
      // NOTE: Customer processor đã tự tạo error file trong processImportWithProgress
      // Chỉ generate nếu processor chưa tạo (result.errorFileUrl chưa có)
      if (result.errors.length > 0 && !result.errorFileUrl) {
        try {
          const errorFileUrl = await this.productProcessor.generateErrorFile(
            workbook,
            result.errors,
          );
          result.errorFileUrl = errorFileUrl;
          // logger.info(
          //   `[Excel Import] Generated error file: ${errorFileUrl} với ${result.errors.length} lỗi`,
          // );
        } catch (error: any) {
          logger.error("[Excel Import] Failed to generate error file:", error);
        }
      }

      // 5. Complete job
      job.status = "completed";
      job.progress = 100;
      job.totalRows = result.totalRows;
      job.processedRows = result.totalRows;
      job.successRows = result.successRows;
      job.errorRows = result.errorRows;
      job.skippedRows = result.skippedRows;
      job.errors = result.errors;
      job.result = result;
      job.completedAt = new Date();

      // Update all layers to completed
      if (result.layers) {
        job.layers = result.layers.map((layer) => ({
          ...layer,
          status: layer.status === "failed" ? "failed" : "completed",
          progress: 100,
        }));
      }

      this.notifyProgress(req, jobId);

      // 6. Cleanup job sau 1 giờ
      setTimeout(
        () => {
          this.importJobs.delete(jobId);
        },
        60 * 60 * 1000,
      );
    } catch (error: any) {
      job.status = "failed";
      job.completedAt = new Date();
      job.errors.push({
        row: 0,
        message: error.message || "Lỗi không xác định",
      });

      // Mark current processing layer as failed
      if (job.layers) {
        for (const layer of job.layers) {
          if (layer.status === "processing") {
            layer.status = "failed";
            break;
          }
        }
      }

      this.notifyProgress(req, jobId);
    }
  }

  /**
   * Notify progress via socket and SSE
   */
  private notifyProgress(req: Request, jobId: string): void {
    // console.log(`🔔 [Progress] Notifying progress for job: ${jobId}`);

    const job = this.importJobs.get(jobId);
    if (!job) {
      // console.log(`⚠️ [Progress] Job ${jobId} not found in importJobs`);
      return;
    }

    // console.log(
    //   `📊 [Progress] Job status: ${job.status}, Progress: ${job.progress}%, Processed: ${job.processedRows}/${job.totalRows}`,
    // );

    const userId = req.user?.userId;

    if (userId) {
      const progressData: any = {
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        successRows: job.successRows,
        errorRows: job.errorRows,
        skippedRows: job.skippedRows,
        errors: job.errors.slice(-10), // Chỉ gửi 10 lỗi gần nhất
        layers: job.layers || [], // Layered progress
      };

      // Chỉ gửi errorFileUrl trong message cuối cùng
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.result?.errorFileUrl
      ) {
        progressData.errorFileUrl = job.result.errorFileUrl;
      }

      SocketUtils.sendSocketImportProgress(userId, progressData);
    }

    // Send via SSE
    // console.log(`📡 [Progress] Calling notifyProgressSSE for job: ${jobId}`);
    this.notifyProgressSSE(jobId);
  }

  /**
   * Send progress update via SSE
   */
  private notifyProgressSSE(jobId: string): void {
    const job = this.importJobs.get(jobId);
    if (!job) {
      return;
    }

    const clients = this.sseClients.get(jobId);

    if (!clients || clients.length === 0) {
      return;
    }

    const progressData: any = {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successRows: job.successRows,
      errorRows: job.errorRows,
      skippedRows: job.skippedRows,
      errors: job.errors.slice(-10),
      layers: job.layers || [], // Layered progress
    };

    // Chỉ gửi errorFileUrl trong message cuối cùng
    if (
      (job.status === "completed" || job.status === "failed") &&
      job.result?.errorFileUrl
    ) {
      progressData.errorFileUrl = job.result.errorFileUrl;
    }

    const data = JSON.stringify(progressData);

    // Send to all clients and remove dead ones
    const deadClients: number[] = [];
    clients.forEach((client, index) => {
      try {
        client.write(`data: ${data}\n\n`);
        // Force flush buffer to send immediately
        if (typeof (client as any).flush === "function") {
          (client as any).flush();
        }
      } catch (error) {
        deadClients.push(index);
      }
    });

    // Remove dead clients
    deadClients.reverse().forEach((index) => clients.splice(index, 1));

    // Close connections if job is done
    if (job.status === "completed" || job.status === "failed") {
      clients.forEach((client) => {
        try {
          client.end();
        } catch (error) {
          // Ignore
        }
      });
      this.sseClients.delete(jobId);
    }
  }

  /**
   * Legacy import method (deprecated - use startImportJob instead)
   */
  async importData(
    req: Request,
    options: ImportOptions,
  ): Promise<ImportResult> {
    // 1. Lấy thông tin file từ fileService
    const file = await this.fileService.findById(options.fileId);
    if (!file) {
      throw new NotFoundError("File không tồn tại");
    }

    // 2. Đọc file Excel
    // File path có thể là absolute hoặc relative
    const filePath = path.isAbsolute(file.path)
      ? file.path
      : path.join(process.cwd(), file.path);

    try {
      await fs.access(filePath);
    } catch (error) {
      // logger.error("File not found:", { filePath, error });
      throw new NotFoundError("File không tồn tại trên server");
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // 3. Process import theo entity type
    let result: ImportResult;

    switch (options.entityType) {
      case ExcelEntityType.PRODUCT:
        result = await this.productProcessor.processImport(
          req,
          workbook,
          options,
        );
        break;

      case ExcelEntityType.CUSTOMER:
        result = await this.customerProcessor.processImport(
          req,
          workbook,
          options,
        );
        break;

      // Có thể thêm các entity khác
      default:
        throw new Error(
          `Entity type '${options.entityType}' không được hỗ trợ`,
        );
    }

    return result;
  }

  /**
   * Validate file Excel trước khi import
   */
  async validateImportFile(
    fileId: string,
    entityType: ExcelEntityType,
  ): Promise<{ message: string; valid: boolean; errors: IError[] }> {
    const file = await this.fileService.findById(fileId);
    if (!file) {
      return {
        message: "File không tồn tại",
        valid: false,
        errors: [
          {
            field: "fileId",
            code: ErrorsMessages.not_found,
          },
        ],
      };
    }

    let message: string = "";
    const errors: IError[] = [];

    // Check file extension
    if (!file.fileName.endsWith(".xlsx") && !file.fileName.endsWith(".xls")) {
      message += "File không phải định dạng Excel. ";
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      message += "Kích thước file vượt quá giới hạn 10MB. ";
      errors.push({
        field: "fileId",
        code: ErrorsMessages.max,
      });
    }

    // Read and validate structure
    try {
      const filePath = path.isAbsolute(file.path)
        ? file.path
        : path.join(process.cwd(), file.path);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // Validate based on entity type
      switch (entityType) {
        case ExcelEntityType.PRODUCT:
          this.validateProductSheet(workbook, errors);
          break;
        case ExcelEntityType.CUSTOMER:
          this.validateCustomerSheet(workbook, errors);
          break;
        case ExcelEntityType.SALE_ORDER:
          this.validateSaleOrderSheet(workbook, errors);
          break;
      }
    } catch (error: any) {
      // logger.error("Error validating Excel file:", error);
      message += "Lỗi khi đọc file Excel. ";
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
    }

    return {
      message: message.trim() || "",
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Product sheet structure
   */
  private validateProductSheet(
    workbook: ExcelJS.Workbook,
    errors: IError[],
  ): void {
    const worksheet = workbook.getWorksheet("Products");
    if (!worksheet) {
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
      return;
    }

    // Check required headers (theo PRODUCT_COLUMNS)
    const requiredHeaders = ["Mã sản phẩm", "Tên sản phẩm"];

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(cell.value?.toString() || "");
    });

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
    }
  }

  private validateCustomerSheet(
    workbook: ExcelJS.Workbook,
    errors: IError[],
  ): void {
    const worksheet = workbook.getWorksheet("Customers");
    if (!worksheet) {
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
      return;
    }

    // Check required headers (theo CUSTOMER_COLUMNS)
    const requiredHeaders = ["Tên khách hàng"];

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(cell.value?.toString() || "");
    });

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
    }
  }

  private validateSaleOrderSheet(
    workbook: ExcelJS.Workbook,
    errors: IError[],
  ): void {
    const worksheet = workbook.getWorksheet("SaleOrders");
    if (!worksheet) {
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
      return;
    }

    // Check required headers (theo SALE_ORDER_COLUMNS)
    const requiredHeaders = [
      "Mã đơn hàng",
      "Mã khách hàng",
      "Mã sản phẩm/SKU",
      "Đơn giá",
      "Số lượng",
    ];

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(cell.value?.toString() || "");
    });

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      errors.push({
        field: "fileId",
        code: ErrorsMessages.invalid,
      });
    }
  }
}
