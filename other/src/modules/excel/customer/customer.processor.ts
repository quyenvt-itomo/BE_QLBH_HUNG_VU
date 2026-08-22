import { injectable, inject } from "inversify";
import { Request } from "express";
import ExcelJS from "exceljs";
import * as fs from "fs/promises";
import * as path from "path";
import {
  ImportOptions,
  ImportResult,
  ImportError,
  ImportErrorHandling,
  ImportDuplicateHandling,
} from "../excel.types";
import {
  PARTNER_TYPES,
  PartnerRepository,
  PartnerService,
} from "@/modules/partner";
import { DataSource, DeepPartial } from "typeorm";
import { Partner } from "@/database/models/Partner";
import logger from "@/shared/utils/logger";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/modules/attribute";
import {
  AttributeTypeEnum,
  PartnerTypeEnum,
  LoyaltyPointTransactionTypeEnum,
  DebtDirectionEnum,
  PartnerDebtSideEnum,
} from "@/shared/constants/enum";
import {
  CUSTOMER_COLUMNS,
  CustomerKey,
  RawCustomerRow,
} from "./customer.types";
import { DatabaseConfig } from "@/config/database";
import {
  ValidatedCustomerRow,
  CustomerExcelRowSchema,
} from "./customer.validator";
import { generateCode } from "@/shared/utils/code.utils";
import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";
import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import { LOYALTY_POINT_TYPES } from "@/modules/loyaltyPoint/loyaltyPoint.types";
import { LoyaltyPointRecalculateService } from "@/modules/loyaltyPoint/loyaltyPointRecalculate.service";
import { PARTNER_DEBT_TYPES } from "@/modules/partnerDebt/partnerDebt.types";
import { PartnerDebtRecalculateService } from "@/modules/partnerDebt/partnerDebtRecalculate.service";

/**
 * Customer Excel Processor
 * Xử lý import customer từ file Excel với realtime progress và error reporting
 */
@injectable()
export class CustomerExcelProcessor {
  constructor(
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepo: PartnerRepository,
    @inject(PARTNER_TYPES.PartnerService)
    private partnerService: PartnerService,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepo: AttributeRepository,
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService)
    private loyaltyPointRecalculateService: LoyaltyPointRecalculateService,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtRecalculateService)
    private partnerDebtRecalculateService: PartnerDebtRecalculateService,
  ) {}

  /**
   * Process import từ Excel workbook với progress callback
   */
  async processImportWithProgress(
    req: Request,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
    onProgress?: (progress: ImportResult) => void,
  ): Promise<ImportResult> {
    const storeId = options.storeId || req.query?.storeId || req.body?.storeId;
    const worksheet = workbook.getWorksheet("Customers");
    if (!worksheet) {
      throw new Error("Không tìm thấy sheet 'Customers' trong file Excel");
    }

    const occurredAt = new Date();

    const result: ImportResult = {
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
      layers: [
        { label: "Kiểm tra dữ liệu", progress: 0, status: "pending" },
        { label: "Nhập dữ liệu", progress: 0, status: "pending" },
        {
          label: "Tính toán lại công nợ, doanh thu, điểm tích lũy",
          progress: 0,
          status: "pending",
        },
      ],
    };

    // Parse rows từ Excel
    const rows = this.parseWorksheet(worksheet);
    result.totalRows = rows.length;

    // logger.info(`[Excel Import] Parsed ${rows.length} rows từ Excel`);

    // Debug: log row đầu tiên nếu có
    if (rows.length > 0) {
      // logger.info(
      //   `[Excel Import] Sample row 1:`,
      //   JSON.stringify(rows[0], null, 2),
      // );
    }

    if (rows.length === 0) {
      // logger.warn(`[Excel Import] Không có dữ liệu để import`);
      return result;
    }

    // logger.info(`[Excel Import] Bắt đầu import ${rows.length} khách hàng`);

    // Calculate socket emission frequency based on total count
    let emitInterval: number;
    if (rows.length > 1000) {
      emitInterval = Math.ceil(rows.length * 0.01); // 1%
    } else if (rows.length > 100) {
      emitInterval = Math.ceil(rows.length * 0.05); // 5%
    } else {
      emitInterval = Math.ceil(rows.length * 0.1); // 10%
    }

    // Validate tất cả rows trước VÀ emit progress
    const validatedRows: ValidatedCustomerRow[] = [];
    const validationErrors: ImportError[] = [];
    let validatedCount = 0;

    // Track last emitted state để chỉ emit khi có thay đổi
    let lastEmittedKey = "";

    // Helper để emit progress chỉ khi có thay đổi
    const emitProgressIfChanged = () => {
      if (!onProgress) return;

      // Tạo key từ layers state
      const currentKey = result.layers
        ?.map((l) => `${l.label}:${l.progress}:${l.status}`)
        .join("|");

      if (currentKey !== lastEmittedKey) {
        lastEmittedKey = currentKey || "";
        onProgress(result);
      }
    };

    // logger.info(`[Excel Import] Bắt đầu validation ${rows.length} dòng...`);

    // Update layer 1 status
    if (result.layers) {
      result.layers[0].status = "processing";
      emitProgressIfChanged();
    }

    for (const row of rows) {
      try {
        // Parse với Zod schema (đã lenient, chỉ reject nếu NAME trống)
        const validated = CustomerExcelRowSchema.parse(row);
        validatedRows.push(validated);

        // Debug log để xem validated data (chỉ log 3 dòng đầu)
        // if (row._rowNumber <= 3) {
        //   logger.info(`[Excel Import] ✅ Validated row ${row._rowNumber}:`);
        //   console.log("Raw row:", JSON.stringify(row, null, 2));
        //   console.log("Validated:", JSON.stringify(validated, null, 2));
        //   console.log("Type field:", {
        //     hasTypeField: "type" in validated,
        //     typeValue: validated.type,
        //     typeValueType: typeof validated.type,
        //   });
        // }
      } catch (error: any) {
        // Zod error có property 'issues' chứa array errors
        const zodErrors = error.issues || error.errors || [];

        // Debug log cho validation error
        // logger.warn(`[Excel Import] Validation error row ${row._rowNumber}:`, {
        //   rowData: row,
        //   errorCount: zodErrors.length,
        //   errors: zodErrors.map((e: any) => ({
        //     path: e.path?.join("."),
        //     message: e.message,
        //   })),
        // });

        if (zodErrors.length > 0) {
          zodErrors.forEach((err: any) => {
            const fieldName = err.path?.join(".") || "unknown";
            const vietnameseFieldName = this.getVietnameseFieldName(fieldName);

            validationErrors.push({
              row: row._rowNumber,
              field: fieldName,
              message: `${vietnameseFieldName}: ${err.message || "Lỗi validation"}`,
              value: err.received,
            });
          });
        } else {
          // Fallback: Nếu không parse được Zod errors, tạo generic error
          validationErrors.push({
            row: row._rowNumber,
            message: error.message || "Lỗi validation không xác định",
          });
        }

        result.errorRows++;
      }

      validatedCount++;

      // Update layer 1 progress
      if (result.layers) {
        result.layers[0].progress = Math.round(
          (validatedCount / rows.length) * 100,
        );
        emitProgressIfChanged();
      }
    }

    // Final emit sau validation
    if (result.layers) {
      result.layers[0].status =
        validationErrors.length === 0 ? "completed" : "failed";
      result.layers[0].progress = 100;
      emitProgressIfChanged();
    }

    result.errors.push(...validationErrors);

    // logger.info(
    //   `[Excel Import] Validation: ${validatedRows.length} hợp lệ, ${result.errorRows} lỗi, ${validationErrors.length} errors collected`,
    // );

    // Process từng customer
    let processedRows = 0;

    // Update layer 2 status
    if (result.layers && validatedRows.length > 0) {
      result.layers[1].status = "processing";
      emitProgressIfChanged();
    }

    for (const validatedRow of validatedRows) {
      try {
        // Check duplicate
        const existingCustomer = await this.findExistingCustomer(validatedRow);

        if (existingCustomer) {
          // Handle duplicate
          const shouldContinue = await this.handleDuplicate(
            req,
            existingCustomer,
            validatedRow,
            options,
            result,
          );
          if (!shouldContinue) {
            if (options.errorHandling === ImportErrorHandling.STOP_ON_ERROR) {
              break;
            }
            continue;
          }
        } else {
          // Create new customer
          await this.createCustomer(validatedRow, result, occurredAt, storeId);
        }

        // Update processed count and notify progress
        processedRows++;

        // Update layer 2 progress
        if (result.layers) {
          result.layers[1].progress = Math.round(
            (processedRows / validatedRows.length) * 100,
          );
          emitProgressIfChanged();
        }
      } catch (error: any) {
        // Log error GỐC trước khi translate
        // console.error(`\n=== ERROR DETAILS row ${validatedRow._rowNumber} ===`);
        // console.error("Error message GỐC:", error.message);
        // console.error("Error name:", error.name);
        // console.error("Error stack:", error.stack);
        // console.error(
        //   "Validated row data:",
        //   JSON.stringify(validatedRow, null, 2),
        // );
        // console.error("====================\n");

        // logger.error(
        //   `Error processing customer row ${validatedRow._rowNumber}: ${error.message}`,
        // );

        // Translate error message sang tiếng Việt
        let errorMsg = error.message || "Lỗi không xác định";

        // Chỉ translate nếu chắc chắn là lỗi về "type" field
        if (
          errorMsg.toLowerCase().includes("type") &&
          errorMsg.toLowerCase().includes("invalid")
        ) {
          errorMsg = `Loại khách hàng không hợp lệ (Lỗi gốc: ${error.message})`;
        }

        result.errors.push({
          row: validatedRow._rowNumber,
          message: errorMsg,
        });

        result.errorRows++;

        if (options.errorHandling === ImportErrorHandling.STOP_ON_ERROR) {
          break;
        }
      }
    }

    // logger.info(
    //   `[Excel Import] Hoàn thành: ${result.successRows} thành công, ${result.errorRows} lỗi, ${result.skippedRows} bỏ qua`,
    // );

    // Update layer 2 final status
    if (result.layers) {
      result.layers[1].status = "completed";
      result.layers[1].progress = 100;
      emitProgressIfChanged();
    }

    // Tính lại điểm tích lũy và công nợ nếu có successful imports
    if (result.successRows > 0) {
      await this.recalculateAfterImport(
        occurredAt,
        result,
        storeId,
        onProgress,
      );
    }

    // Tạo error file nếu có lỗi (CHỈ chứa các dòng lỗi)
    // Sử dụng errorRows thay vì errors.length để đảm bảo file luôn được tạo khi có lỗi
    if (result.errorRows > 0) {
      // logger.info(
      //   `[Excel Import] Tạo error file cho ${result.errorRows} dòng lỗi với ${result.errors.length} error details`,
      // );
      await this.createErrorFile(workbook, result, rows);
    }

    return result;
  }

  /**
   * Parse worksheet thành array of rows
   */
  private parseWorksheet(worksheet: ExcelJS.Worksheet): RawCustomerRow[] {
    const rows: RawCustomerRow[] = [];
    const headers: (CustomerKey | undefined)[] = [];

    // Get headers
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const headerText = cell.value?.toString() || "";
      const normalizedHeader = this.normalizeHeader(headerText);
      headers[colNumber] = normalizedHeader;

      // Debug log để xem header mapping
      if (!normalizedHeader && headerText) {
        // logger.warn(
        //   `[Excel Import] Header không nhận diện: "${headerText}" tại cột ${colNumber}`,
        // );
      }
    });

    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData: any = { _rowNumber: rowNumber };
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          const value = this.getCellValue(cell);
          rowData[header] = value;
          // hasData = true nếu có bất kỳ giá trị nào (kể cả 0, false, "")
          if (value !== null && value !== undefined) {
            hasData = true;
          }
        }
      });

      if (hasData) {
        rows.push(rowData);
      }
    });

    return rows;
  }

  /**
   * Normalize header to CustomerKey
   */
  private normalizeHeader(header: string): CustomerKey | undefined {
    const col = CUSTOMER_COLUMNS.find((c) => c.header === header);
    return col?.field as CustomerKey;
  }

  /**
   * Dịch field name sang tiếng Việt
   */
  private getVietnameseFieldName(field: string): string {
    const col = CUSTOMER_COLUMNS.find((c) => c.field === field);
    return col?.header || field;
  }

  /**
   * Get cell value với handling cho các kiểu dữ liệu
   */
  private getCellValue(cell: ExcelJS.Cell): any {
    if (!cell.value) return null;

    // Handle formula
    if (cell.type === ExcelJS.ValueType.Formula) {
      return (cell.value as any).result || null;
    }

    // Handle rich text
    if (typeof cell.value === "object" && "richText" in cell.value) {
      return (cell.value as any).richText.map((t: any) => t.text).join("");
    }

    return cell.value;
  }

  /**
   * Tìm customer đã tồn tại
   */
  private async findExistingCustomer(
    row: ValidatedCustomerRow,
  ): Promise<Partner | null> {
    const conditions = [];

    // Check by code
    if (row.code) {
      const byCode = await this.partnerRepo.findOne({
        where: { code: row.code, type: PartnerTypeEnum.CUSTOMER },
      });
      if (byCode) return byCode;
    }

    // Check by phone
    if (row.phone) {
      const byPhone = await this.partnerRepo.findOne({
        where: { phone: row.phone, type: PartnerTypeEnum.CUSTOMER },
      });
      if (byPhone) return byPhone;
    }

    // Check by email
    if (row.email) {
      const byEmail = await this.partnerRepo.findOne({
        where: { email: row.email, type: PartnerTypeEnum.CUSTOMER },
      });
      if (byEmail) return byEmail;
    }

    return null;
  }

  /**
   * Create new customer với loyalty point và debt adjustments
   */
  private async createCustomer(
    row: ValidatedCustomerRow,
    result: ImportResult,
    occurredAt: Date,
    storeId?: string | null,
  ): Promise<void> {
    // Tìm group nếu có
    let groupId: string | null = null;
    if (row.group) {
      const group = await this.attributeRepo.findOne({
        where: {
          name: row.group,
          type: AttributeTypeEnum.CUSTOMER_GROUP,
        },
      });
      groupId = group?.id || null;
    }

    // Tạo code tự động nếu không có
    const code = row.code || (await generateCode(Partner, "customer"));

    // Parse address từ format "Tỉnh/TP - Phường/Xã"
    const addresses = [];
    if (row.address || row.detailAddress) {
      const [state, ward] = (row.address || "").split("-").map((s) => s.trim());
      addresses.push({
        state: state || "",
        ward: ward || "",
        detail: row.detailAddress || "",
      });
    }

    // Convert type field
    const isOrganization = row.type
      ? [
          "tổ chức",
          "to chuc",
          "organization",
          "doanh nghiep",
          "công ty",
        ].includes(row.type.toLowerCase().trim())
      : false;

    const partnerData: DeepPartial<Partner> = {
      type: PartnerTypeEnum.CUSTOMER,
      isOrganization,
      code,
      name: row.name,
      email: row.email || null,
      phone: row.phone || null,
      taxCode: row.taxCode || null,
      addresses,
      groupId,
      loyaltyPoints: 0, // Sẽ được tính lại từ adjustments
      totalRevenue: 0, // Sẽ được tính lại từ adjustments
      maxDebtAmount: null,
      banks: [],
    };

    // Save customer TRƯỚC để có partnerId
    try {
      // logger.info(`[Excel Import] Creating customer for row ${row._rowNumber}`);
      const customer = await this.partnerRepo.create(partnerData);

      // Sau khi có partnerId, tạo adjustment records
      const manager = DatabaseConfig.manager;

      // Tạo LoyaltyPointAdjustment nếu có currentLoyaltyPoints hoặc currentRevenue
      if (row.currentLoyaltyPoints || row.currentRevenue) {
        const code = await generateCode(LoyaltyPointAdjustment);

        const loyaltyPointAdjustment = manager.create(LoyaltyPointAdjustment, {
          code,
          occurredAt,
          partnerId: customer.id,
          direction: LoyaltyPointTransactionTypeEnum.INCREASE,
          expectedRevenue: row.currentRevenue || 0,
          countedRevenue: 0,
          expectedPoints: row.currentLoyaltyPoints || 0,
          countedPoints: 0,
          deltaPoints: row.currentLoyaltyPoints || 0,
          reason: "Điều chỉnh điểm tích lũy từ import Excel khách hàng",
        });

        await manager.save(LoyaltyPointAdjustment, loyaltyPointAdjustment);
      }

      // Tạo PartnerDebtAdjustment nếu có receivableAmount (yêu cầu storeId)
      if (row.receivableAmount && storeId) {
        const code = await generateCode(PartnerDebtAdjustment);

        const partnerDebtAdjustment = manager.create(PartnerDebtAdjustment, {
          code,
          occurredAt,
          storeId,
          partnerId: customer.id,
          side: PartnerDebtSideEnum.RECEIVABLE,
          expectedAmount: row.receivableAmount || 0,
          countedAmount: 0,
          deltaAmount: row.receivableAmount,
          direction: DebtDirectionEnum.INCREASE,
          reason: "Điều chỉnh công nợ từ import Excel khách hàng",
          adjustedById: null,
          adjustedBySnapshot: null,
          isInitialAdjustment: true,
        });

        await manager.save(PartnerDebtAdjustment, partnerDebtAdjustment);
      }

      result.successRows++;
      result.data?.push(customer);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Handle duplicate customer
   */
  private async handleDuplicate(
    req: Request,
    existingCustomer: Partner,
    row: ValidatedCustomerRow,
    options: ImportOptions,
    result: ImportResult,
  ): Promise<boolean> {
    switch (options.duplicateHandling) {
      case ImportDuplicateHandling.STOP:
        result.errors.push({
          row: row._rowNumber,
          message: `Khách hàng đã tồn tại: ${existingCustomer.code} - ${existingCustomer.name}`,
        });
        result.errorRows++;
        return false;

      case ImportDuplicateHandling.SKIP:
        result.skippedRows++;
        return false;

      case ImportDuplicateHandling.UPDATE:
        await this.updateCustomer(existingCustomer, row, result);
        return false;

      default:
        return false;
    }
  }

  /**
   * Update existing customer
   */
  private async updateCustomer(
    existingCustomer: Partner,
    row: ValidatedCustomerRow,
    result: ImportResult,
  ): Promise<void> {
    // Find group nếu có
    let groupId: string | null = existingCustomer.groupId;
    if (row.group) {
      const group = await this.attributeRepo.findOne({
        where: {
          name: row.group,
          type: AttributeTypeEnum.CUSTOMER_GROUP,
        },
      });
      groupId = group?.id || null;
    }

    // Parse address
    const addresses = existingCustomer.addresses || [];
    if (row.address || row.detailAddress) {
      const [state, ward] = (row.address || "").split("-").map((s) => s.trim());
      addresses[0] = {
        state: state || "",
        ward: ward || "",
        detail: row.detailAddress || "",
      };
    }

    // Update data
    const isOrganization = row.type
      ? [
          "tổ chức",
          "to chuc",
          "organization",
          "doanh nghiep",
          "công ty",
        ].includes(row.type.toLowerCase().trim())
      : false;

    const updateData = {
      isOrganization,
      name: row.name,
      email: row.email || existingCustomer.email,
      phone: row.phone || existingCustomer.phone,
      taxCode: row.taxCode || existingCustomer.taxCode,
      addresses,
      groupId,
      loyaltyPoints: row.currentLoyaltyPoints || existingCustomer.loyaltyPoints,
      totalRevenue: row.currentRevenue || existingCustomer.totalRevenue,
    };

    await this.partnerService.update(
      existingCustomer.id,
      updateData as any,
      {} as any,
    );

    result.successRows++;
    result.data?.push({ ...existingCustomer, ...updateData });
  }

  /**
   * Tính lại sau khi import thành công
   */
  private async recalculateAfterImport(
    occurredAt: Date,
    result: ImportResult,
    storeId?: string,
    onProgress?: (progress: ImportResult) => void,
  ): Promise<void> {
    try {
      // Update layer 3 status
      if (result.layers) {
        result.layers[2].status = "processing";
        result.layers[2].progress = 0;
      }
      if (onProgress) onProgress(result);

      // Thu thập partnerIds từ result.data
      const partnerIds = (result.data || [])
        .filter((p: any) => p && p.id)
        .map((p: any) => p.id);

      if (partnerIds.length === 0) return;

      // Don't pass manager - let services create their own
      if (partnerIds.length > 2000) {
        const BATCH_SIZE = Math.ceil(partnerIds.length / 100);
        const chunks: string[][] = [];
        for (let i = 0; i < partnerIds.length; i += BATCH_SIZE) {
          chunks.push(partnerIds.slice(i, i + BATCH_SIZE));
        }
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          await this.loyaltyPointRecalculateService.recalculateFromDate(
            occurredAt,
            undefined,
            chunk,
          );
          if (storeId) {
            await this.partnerDebtRecalculateService.recalculateFromDate(
              storeId,
              occurredAt,
              undefined,
              chunk,
            );
          }
          if (result.layers) {
            result.layers[2].progress = Math.round(
              ((i + 1) / chunks.length) * 100,
            );
          }
          if (onProgress) onProgress(result);
        }
      } else {
        await this.loyaltyPointRecalculateService.recalculateFromDate(
          occurredAt,
          undefined,
          partnerIds,
        );
        if (result.layers) {
          result.layers[2].progress = 50;
        }
        if (onProgress) onProgress(result);
        if (storeId) {
          await this.partnerDebtRecalculateService.recalculateFromDate(
            storeId,
            occurredAt,
            undefined,
            partnerIds,
          );
        }
        if (result.layers) {
          result.layers[2].progress = 100;
        }
        if (onProgress) onProgress(result);
      }

      // Update layer 3 final status
      if (result.layers) {
        result.layers[2].status = "completed";
      }
      if (onProgress) onProgress(result);
    } catch (error) {
      if (result.layers) {
        result.layers[2].status = "failed";
      }
      if (onProgress) onProgress(result);
      logger.error(`[Excel Import] Lỗi khi tính lại dữ liệu:`, error);
      throw error;
    }
  }

  /**
   * Tạo file Excel CHỈ CHỨA các dòng lỗi
   */
  private async createErrorFile(
    originalWorkbook: ExcelJS.Workbook,
    result: ImportResult,
    rows: RawCustomerRow[],
  ): Promise<void> {
    const errorWorkbook = new ExcelJS.Workbook();
    const errorWorksheet = errorWorkbook.addWorksheet("Customers");

    // Copy structure from original
    const originalSheet = originalWorkbook.getWorksheet("Customers");
    if (!originalSheet) {
      logger.warn(
        "Cannot find 'Customers' sheet in original workbook, creating error file from scratch",
      );
      // Continue creating error file even without original sheet
    }

    // Setup columns with error column
    const columns: any[] = CUSTOMER_COLUMNS.map((col) => ({
      header: col.header,
      key: col.field,
      width: col.width || 15,
    }));
    columns.push({ header: "LỖI", key: "errorReason", width: 50 });
    errorWorksheet.columns = columns;

    // Format header row
    const headerRow = errorWorksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF0000" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Map errors by row number
    const errorsByRow = new Map<number, string[]>();
    result.errors.forEach((err) => {
      if (!errorsByRow.has(err.row)) {
        errorsByRow.set(err.row, []);
      }
      errorsByRow.get(err.row)!.push(err.message);
    });

    // CHỈ ADD các dòng có lỗi (không add tất cả)
    let errorRowCount = 0;
    const processedRowNumbers = new Set<number>();

    for (const row of rows) {
      const errors = errorsByRow.get(row._rowNumber);

      // Nếu có error details cho row này
      if (errors && errors.length > 0) {
        const errorRow = errorWorksheet.addRow({
          ...row,
          errorReason: errors.join("; "),
        });

        // Highlight error row
        errorRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFC7CE" },
        };
        errorRowCount++;
        processedRowNumbers.add(row._rowNumber);
      }
    }

    // Nếu có errorRows nhưng không có error details, thêm tất cả rows với generic message
    if (errorRowCount === 0 && result.errorRows > 0) {
      logger.warn(
        `[Excel Import] Có ${result.errorRows} dòng lỗi nhưng không có error details, thêm tất cả rows với message generic`,
      );
      for (const row of rows) {
        const errorRow = errorWorksheet.addRow({
          ...row,
          errorReason: "Lỗi validation - vui lòng kiểm tra định dạng dữ liệu",
        });
        errorRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFC7CE" },
        };
        errorRowCount++;
      }
    }

    logger.info(`[Excel Import] Tạo file lỗi với ${errorRowCount} dòng lỗi`);

    // Save error file
    const errorFileName = `customer_errors_${Date.now()}.xlsx`;
    const errorFilePath = path.join(
      process.cwd(),
      "uploads",
      "temp",
      "errors",
      errorFileName,
    );

    await fs.mkdir(path.dirname(errorFilePath), { recursive: true });
    await errorWorkbook.xlsx.writeFile(errorFilePath);

    result.errorFileUrl = `/uploads/temp/errors/${errorFileName}`;
  }

  /**
   * Process import (wrapper for compatibility)
   */
  async processImport(
    req: Request,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
  ): Promise<ImportResult> {
    return this.processImportWithProgress(req, workbook, options);
  }
}
