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
import { PRODUCT_TYPES, ProductRepository } from "@/modules/product";
import { DeepPartial } from "typeorm";
import { Product } from "@/database/models/Product";
import { ProductOption } from "@/database/models/ProductOption";
import { ProductVariant } from "@/database/models/ProductVariant";
import logger from "@/shared/utils/logger";
import { ATTRIBUTE_TYPES, AttributeRepository } from "@/modules/attribute";
import {
  AttributeTypeEnum,
  InventoryRefTypeEnum,
  InventoryTransactionTypeEnum,
} from "@/shared/constants/enum";
import { PRODUCT_COLUMNS, ProductKey, RawProductRow } from "./product.types";
import {
  PRODUCT_VARIANT_TYPES,
  ProductVariantRepository,
} from "@/modules/product/productVariant";
import { DatabaseConfig } from "@/config/database";
import { generateCode } from "@/shared/utils/code.utils";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { InventoryAdjustmentLine } from "@/database/models/store/InventoryAdjustmentLine";
import {
  EMPLOYEE_TYPES,
  EmployeeSnapshot,
} from "@/modules/employee/employee.types";
import { EmployeeRepository } from "@/modules/employee/employee.repository";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";

/**
 * Product Excel Processor
 * Xử lý import product từ file Excel
 *
 * Format mới:
 * - Sản phẩm đơn giản: 1 dòng (isVariant = false hoặc không có)
 * - Sản phẩm biến thể:
 *   + Dòng đầu: thông tin product (isVariant = false)
 *   + Các dòng sau: variants (isVariant = true)
 *   + Quy cách: "Màu: Đen - Size: M"
 */
@injectable()
export class ProductExcelProcessor {
  constructor(
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepo: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepo: AttributeRepository,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepo: ProductVariantRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepo: EmployeeRepository,
  ) {}

  /**
   * Process import từ Excel workbook
   */
  async processImport(
    req: Request,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
  ): Promise<ImportResult> {
    return this.processImportWithProgress(req, workbook, options);
  }

  /**
   * Process import với progress callback
   */
  async processImportWithProgress(
    req: Request,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
    onProgress?: (progress: ImportResult) => void,
  ): Promise<ImportResult> {
    const worksheet = workbook.getWorksheet("Products");
    if (!worksheet) {
      throw new Error("Không tìm thấy sheet 'Products' trong file Excel");
    }

    const result: ImportResult = {
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
    };

    // Parse rows từ Excel
    const rows = this.parseWorksheet(worksheet);
    result.totalRows = rows.length;

    if (rows.length === 0) {
      return result;
    }

    // Bổ sung code nếu thiếu
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.code) continue;
      if (i === 0 || rows[i - 1].name !== row.name) {
        row.code = await generateCode(Product);
      } else {
        row.code = rows[i - 1].code;
      }
    }

    // Group rows theo product
    const productGroups = this.groupRowsByProduct(rows);
    const totalGroups = Object.keys(productGroups).length;

    logger.info(`[Excel Import] Bắt đầu import ${totalGroups} sản phẩm`);

    // Calculate socket emission frequency based on total count
    let emitInterval: number;
    if (totalGroups > 1000) {
      emitInterval = Math.ceil(totalGroups * 0.01); // 1%
    } else if (totalGroups > 100) {
      emitInterval = Math.ceil(totalGroups * 0.05); // 5%
    } else {
      emitInterval = Math.ceil(totalGroups * 0.1); // 10%
    }

    // Process từng product
    let processedGroups = 0;

    let adjustmentLinesToCreate: DeepPartial<InventoryAdjustmentLine>[] = [];

    for (const [groupKey, productRows] of Object.entries(productGroups)) {
      try {
        const productCode = productRows[0].code;

        // Check duplicate
        const existingProduct = await this.productRepo.findOne({
          where: { code: productCode },
          relations: {
            variants: {
              options: true,
            },
          },
        });

        if (existingProduct) {
          // Handle duplicate
          const shouldContinue = await this.handleDuplicate(
            req,
            existingProduct,
            productRows,
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
          // Create new product
          const adjustmentLine = await this.createProduct(
            req,
            productRows,
            result,
            options,
          );
          if (adjustmentLine.length > 0) {
            adjustmentLinesToCreate.push(...adjustmentLine);
          }
        }

        // Update processed count and notify progress
        processedGroups++;
        result.totalRows = rows.length; // Keep total rows updated

        // Notify progress based on dynamic interval or at completion
        if (
          onProgress &&
          (processedGroups % emitInterval === 0 ||
            processedGroups === totalGroups)
        ) {
          onProgress(result);
        }
      } catch (error: any) {
        logger.error(`Error processing product group ${groupKey}:`, error);

        productRows.forEach((row) => {
          result.errors.push({
            row: row._rowNumber,
            message: error.message || "Lỗi không xác định",
          });
        });

        result.errorRows += productRows.length;

        if (options.errorHandling === ImportErrorHandling.STOP_ON_ERROR) {
          break;
        }
      }
    }

    logger.info(
      `[Excel Import] Hoàn thành: ${result.successRows} thành công, ${result.errorRows} lỗi, ${result.skippedRows} bỏ qua`,
    );

    // Tạo InventoryAdjustment nếu có dữ liệu tồn kho ban đầu
    await this.createInventoryAdjustment(req, adjustmentLinesToCreate);

    return result;
  }

  /**
   * Parse worksheet thành array of rows
   */
  private parseWorksheet(worksheet: ExcelJS.Worksheet): RawProductRow[] {
    const rows: RawProductRow[] = [];
    const headers: (ProductKey | undefined)[] = [];

    // Get headers
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = this.normalizeHeader(cell.value?.toString() || "");
    });

    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData: any = { _rowNumber: rowNumber };
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const field = headers[colNumber];
        if (!field) return;

        const value = this.parseCellValue(cell.value);
        rowData[field] = value;

        if (value !== null && value !== undefined) {
          hasData = true;
        }
      });

      if (hasData) {
        rows.push(rowData as RawProductRow);
      }
    });

    return rows;
  }

  /**
   * Parse cell value
   */
  private parseCellValue(value: any): any {
    if (value === null || value === undefined) return null;

    if (typeof value === "object" && "result" in value) {
      return value.result;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      if (trimmed.toLowerCase() === "có" || trimmed.toLowerCase() === "true")
        return true;
      if (
        trimmed.toLowerCase() === "không" ||
        trimmed.toLowerCase() === "false"
      )
        return false;
      return trimmed;
    }

    return value;
  }

  /**
   * Group rows theo product
   * Logic mới: Group theo CODE, rows có SPECIFICATION là variants
   */
  private groupRowsByProduct(
    rows: RawProductRow[],
  ): Record<string, RawProductRow[]> {
    const groups: Record<string, RawProductRow[]> = {};

    for (const row of rows) {
      if (!row.code) {
        logger.warn(`Row ${row._rowNumber} không hợp lệ: không có mã sản phẩm`);
        continue;
      }

      // Group by code - all rows with same code belong together
      if (!groups[row.code]) {
        groups[row.code] = [];
      }
      groups[row.code].push(row);
    }

    return groups;
  }

  /**
   * Handle duplicate product
   */
  private async handleDuplicate(
    req: Request,
    existingProduct: Product,
    newRows: RawProductRow[],
    options: ImportOptions,
    result: ImportResult,
  ): Promise<boolean> {
    switch (options.duplicateHandling) {
      case ImportDuplicateHandling.STOP:
        newRows.forEach((row) => {
          result.errors.push({
            row: row._rowNumber,
            field: "code",
            message: `Mã sản phẩm '${row.code}' đã tồn tại`,
            value: row.code,
          });
        });
        result.errorRows += newRows.length;
        return false;

      case ImportDuplicateHandling.SKIP:
        result.skippedRows += newRows.length;
        return false;

      case ImportDuplicateHandling.UPDATE:
        await this.updateProduct(
          req,
          existingProduct,
          newRows,
          result,
          options,
        );
        return true;

      default:
        return false;
    }
  }

  /**
   * Create new product
   */
  private async createProduct(
    req: Request,
    rows: RawProductRow[],
    result: ImportResult,
    options: ImportOptions,
  ): Promise<DeepPartial<InventoryAdjustmentLine>[]> {
    const adjustmentLines: DeepPartial<InventoryAdjustmentLine>[] = [];
    const firstRow = rows[0]; // Dòng đầu là thông tin product

    const hasVariant = rows.some((r) => r.specification);
    // tồn tại một dòng có specification

    // Validate required fields
    const validationErrors = this.validateProductData(firstRow);
    if (validationErrors.length > 0) {
      result.errors.push(...validationErrors);
      result.errorRows += rows.length;
      return adjustmentLines;
    }

    // Resolve category and unit (case-insensitive + hierarchy)
    let categoryId: string | null = null;
    let unitId: string | null = null;

    if (firstRow.categoryName) {
      categoryId = await this.findCategoryByPath(firstRow.categoryName);
    }

    if (firstRow.unitName) {
      unitId = await this.findUnitByName(firstRow.unitName);
    }

    // Build product data
    const productData: DeepPartial<Product> = {
      code: firstRow.code,
      name: firstRow.name,
      categoryId,
      unitId,
      taxRate: firstRow.taxRate || 0,
      note: firstRow.note || null,
      hasVariant,
    };

    // Build options và variant info
    const productOptions: DeepPartial<ProductOption>[] = [];
    const variantInfoMap = new Map<
      string, // key = signature của options
      {
        sku: string | null;
        barcode: string | null;
        costPrice: number;
        price: number;
        isActive: boolean;
        options: DeepPartial<ProductOption>[];
        initialStock: number | null; // Thêm initialStock
      }
    >();

    // Có variants - parse options từ specification
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Parse options từ format "Màu: Đen - Size: M"
      const { options, sku } = await this.parseVariantOptions(
        row.specification!,
      );

      // Giá: nếu variant không có giá thì lấy từ product
      const costPrice = row.variantCostPrice ?? firstRow.variantCostPrice ?? 0;
      const price = row.variantPrice ?? firstRow.variantPrice ?? 0;

      // Build signature để match variant sau này
      const signature = this.buildOptionSignature(options);

      let barcode: string | null = null;
      if (row.barcode) {
        barcode = row.barcode;
      } else if (productData.hasVariant) {
        const subCode = `${productData.code || ""}${i + 1}`;
        barcode = subCode || null;
      } else {
        barcode = productData.code || null;
      }

      variantInfoMap.set(signature, {
        sku: row.sku || sku || null,
        barcode,
        costPrice,
        price,
        isActive: true, // Default to active
        options,
        initialStock: row.initialStock || null,
      });

      productOptions.push(...options);
    }

    // Create product (chỉ tạo product + options, KHÔNG tạo variants)
    try {
      const created = await this.productRepo.create({
        ...productData,
        options: productOptions,
      } as any);

      // Gọi updateVariantsOnOptionChange để tự sinh variants
      const manager = DatabaseConfig.manager;
      await this.productVariantRepo.updateVariantsOnOptionChange({
        productId: created.id,
        manager,
      });

      // Load product với variants đã được sinh
      const productWithVariants = await this.productRepo.findOne({
        where: { id: created.id },
        relations: {
          variants: {
            options: { type: true },
          },
          options: { type: true },
        },
      });

      if (!productWithVariants) {
        throw new Error("Cannot reload product after creation");
      }

      if (variantInfoMap.size > 0) {
        for (const variant of productWithVariants.variants || []) {
          const signature = this.buildOptionSignatureFromVariant(variant);
          const variantInfo = variantInfoMap.get(signature);

          if (variantInfo) {
            // Cập nhật thông tin variant
            await this.productVariantRepo.update(variant.id, {
              sku: variantInfo.sku,
              barcode: variantInfo.barcode,
              costPrice: variantInfo.costPrice,
              price: variantInfo.price,
              isActive: true,
            });

            // Thu thập dữ liệu tồn kho ban đầu nếu có
            if (
              variantInfo.initialStock &&
              variantInfo.initialStock > 0 &&
              variantInfo.costPrice > 0
            ) {
              adjustmentLines.push({
                productVariantId: variant.id,
                expectedQty: variantInfo.initialStock,
              });
            }
          }
        }
      } else {
        // Sản phẩm đơn giản - cập nhật variant duy nhất
        const singleVariant = productWithVariants.variants?.[0];
        if (singleVariant) {
          await this.productVariantRepo.update(singleVariant.id, {
            sku: firstRow.sku || firstRow.code,
            barcode: firstRow.barcode || null,
            costPrice: firstRow.variantCostPrice || 0,
            price: firstRow.variantPrice || 0,
            isActive: true,
          });

          // Thu thập dữ liệu tồn kho ban đầu cho sản phẩm đơn giản
          const costPrice = firstRow.variantCostPrice || 0;
          const initialStock = firstRow.initialStock || 0;
          if (initialStock > 0 && costPrice > 0) {
            adjustmentLines.push({
              productVariantId: singleVariant.id,
              expectedQty: initialStock,
            });
          }
        }
      }

      result.successRows += rows.length;
      result.data?.push(productWithVariants);
      return adjustmentLines;
    } catch (error: any) {
      rows.forEach((row) => {
        result.errors.push({
          row: row._rowNumber,
          message: error.message || "Lỗi khi tạo sản phẩm",
        });
      });
      result.errorRows += rows.length;
      return adjustmentLines;
    }
  }

  /**
   * Update existing product
   */
  private async updateProduct(
    req: Request,
    existingProduct: Product,
    rows: RawProductRow[],
    result: ImportResult,
    options: ImportOptions,
  ): Promise<void> {
    // TODO: Implement update logic
    // result.skippedRows += rows.length;
    // Cập nhật categoryId, unitId theo logic tương tự createProduct
    let categoryId: string | null = existingProduct.categoryId;
    let unitId: string | null = existingProduct.unitId;

    const firstRow = rows[0];

    if (firstRow.categoryName) {
      categoryId = await this.findCategoryByPath(firstRow.categoryName);
    }
    if (firstRow.unitName) {
      unitId = await this.findUnitByName(firstRow.unitName);
    }
    const productData: Partial<Product> = {
      id: existingProduct.id,
      categoryId,
      unitId,
    };

    await this.productRepo.update(existingProduct.id, productData);
    result.successRows += rows.length;
  }

  /**
   * Validate product data
   */
  private validateProductData(row: RawProductRow): ImportError[] {
    const errors: ImportError[] = [];

    if (!row.code) {
      errors.push({
        row: row._rowNumber,
        field: "code",
        message: "Mã sản phẩm không được để trống",
      });
    }

    if (!row.name) {
      errors.push({
        row: row._rowNumber,
        field: "name",
        message: "Tên sản phẩm không được để trống",
      });
    }

    if (row.taxRate && (row.taxRate < 0 || row.taxRate > 100)) {
      errors.push({
        row: row._rowNumber,
        field: "taxRate",
        message: "Thuế suất phải từ 0 đến 100",
        value: row.taxRate,
      });
    }

    return errors;
  }

  /**
   * Tạo InventoryAdjustment với initialStock từ Excel import
   */
  private async createInventoryAdjustment(
    req: Request,
    adjustmentLinesData: DeepPartial<InventoryAdjustmentLine>[],
  ): Promise<void> {
    if (adjustmentLinesData.length === 0) {
      return;
    }

    // Lấy storeId từ request
    const storeId = req.query?.storeId || req.body?.storeId;
    if (!storeId) {
      return;
    }

    // Lấy userId từ request
    const employeeId = req.employeeId;
    let employeeSnapshot: EmployeeSnapshot | null = null;
    if (employeeId) {
      // Lấy snapshot nhân viên
      employeeSnapshot =
        await this.employeeRepo.getEmployeeSnapshot(employeeId);
    }

    // Add sortOrder to lines
    const lines: DeepPartial<InventoryAdjustmentLine>[] =
      adjustmentLinesData.map((data, index) => ({
        productVariantId: data.productVariantId,
        expectedQty: data.expectedQty,
        countedQty: 0, // Mới nhập hàng nên countedQty = 0
        deltaQty: data.expectedQty, // deltaQty = expectedQty - countedQty
        direction: InventoryTransactionTypeEnum.IN,
        sortOrder: index + 1,
      }));

    // Generate code for adjustment
    const manager = DatabaseConfig.manager;

    const occurredAt = new Date();
    const code = await generateCode(InventoryAdjustment);

    // Create adjustment
    const adjustment = manager.create(InventoryAdjustment, {
      code,
      storeId,
      occurredAt,
      adjustedById: employeeId,
      adjustedBySnapshot: employeeSnapshot,
      reason: `Nhập tồn kho ban đầu từ Excel`,
      lines,
      isInitialAdjustment: true,
    });

    await manager.save(InventoryAdjustment, adjustment);

    const variantIds = Array.from(
      new Set(
        adjustmentLinesData
          .map((line) => line.productVariantId)
          .filter((variantId): variantId is string => Boolean(variantId)),
      ),
    );

    await InventoryRecalculateQueue.enqueueMany(
      variantIds.map((variantId) => ({
        variantId,
        storeId: String(storeId),
        fromDate: occurredAt,
        source: {
          sourceType: InventoryRefTypeEnum.ADJUST,
          refId: adjustment.id,
        },
      })),
    );
  }

  /**
   * Viết hoa chữ cái đầu
   */
  private capitalizeFirstLetter(text: string): string {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Tìm category theo tên và validate hierarchy
   * Hỗ trợ format: "ÁO>>áo khoác + bò + da" hoặc "phụ kiện>>phụ kiện mặt>>Bông tẩy trang"
   */
  private async findCategoryByPath(
    categoryPath: string,
  ): Promise<string | null> {
    if (!categoryPath) return null;

    // Parse path: "parent>>child>>grandchild"
    const parts = categoryPath.split(">>").map((p) => p.trim());

    if (parts.length === 1) {
      // Không có phân cấp - tìm trực tiếp
      const repo = await this.attributeRepo.getRepository();
      let category = await repo
        .createQueryBuilder("attr")
        .where("LOWER(attr.name) = LOWER(:name)", { name: parts[0] })
        .andWhere("attr.type = :type", {
          type: AttributeTypeEnum.PRODUCT_CATEGORY,
        })
        .getOne();

      // Nếu không tìm thấy, tạo mới
      if (!category) {
        category = await this.attributeRepo.create({
          name: this.capitalizeFirstLetter(parts[0]),
          type: AttributeTypeEnum.PRODUCT_CATEGORY,
        } as any);
      }

      return category?.id || null;
    }

    // Có phân cấp - validate từ root đến leaf
    const repo = await this.attributeRepo.getRepository();
    let currentParentId: string | null = null;

    for (let i = 0; i < parts.length; i++) {
      const partName = parts[i];
      const qb = repo
        .createQueryBuilder("attr")
        .where("LOWER(attr.name) = LOWER(:name)", { name: partName })
        .andWhere("attr.type = :type", {
          type: AttributeTypeEnum.PRODUCT_CATEGORY,
        });

      if (i === 0) {
        // Root level - không có parent
        qb.andWhere("attr.parentId IS NULL");
      } else {
        // Child level - phải có parentId đúng
        qb.andWhere("attr.parentId = :parentId", { parentId: currentParentId });
      }

      let found = await qb.getOne();

      // Nếu không tìm thấy, tạo mới
      if (!found) {
        found = await this.attributeRepo.create({
          name: this.capitalizeFirstLetter(partName),
          type: AttributeTypeEnum.PRODUCT_CATEGORY,
          parentId: currentParentId,
        } as any);
      }

      currentParentId = found.id;
    }

    return currentParentId;
  }

  /**
   * Tìm unit theo tên (không phân biệt hoa thường)
   */
  private async findUnitByName(unitName: string): Promise<string | null> {
    if (!unitName) return null;

    const repo = this.attributeRepo.getRepository();
    let unit = await repo
      .createQueryBuilder("attr")
      .where("LOWER(attr.name) = LOWER(:name)", { name: unitName })
      .andWhere("attr.type = :type", {
        type: AttributeTypeEnum.PRODUCT_UNIT,
      })
      .getOne();

    // Nếu không tìm thấy, tạo mới
    if (!unit) {
      unit = await this.attributeRepo.create({
        name: this.capitalizeFirstLetter(unitName),
        type: AttributeTypeEnum.PRODUCT_UNIT,
      } as any);
    }

    return unit?.id || null;
  }

  /**
   * Parse variant options từ format "Màu: Đen - Size: M" hoặc "màu: đen - size: m"
   * Tìm attribute types không phân biệt hoa thường
   */
  private async parseVariantOptions(specification: string): Promise<{
    options: DeepPartial<ProductOption>[];
    sku: string | null;
  }> {
    const options: DeepPartial<ProductOption>[] = [];
    let sku: string | null = null;

    if (!specification) {
      return { options, sku };
    }

    // Parse format: "Màu: Đen - Size: M"
    const parts = specification.split("-").map((p) => p.trim());

    let typeIndex = 0;
    for (const part of parts) {
      const match = part.match(/^([^:]+):\s*(.+)$/i);
      if (match) {
        const typeName = match[1].trim();
        const value = match[2].trim();

        // Tìm attribute type không phân biệt hoa thường
        const repo = this.attributeRepo.getRepository();
        let foundType = await repo
          .createQueryBuilder("attr")
          .where("LOWER(attr.name) = LOWER(:name)", { name: typeName })
          .andWhere("attr.type = :type", {
            type: AttributeTypeEnum.PRODUCT_TYPE,
          })
          .getOne();

        // Nếu không tìm thấy, tạo mới
        if (!foundType) {
          foundType = await this.attributeRepo.create({
            name: this.capitalizeFirstLetter(typeName),
            type: AttributeTypeEnum.PRODUCT_TYPE,
          } as any);
        }

        options.push({
          typeId: foundType.id,
          typeIndex,
          value,
        } as any);
        typeIndex++;
      }
    }

    return { options, sku };
  }

  /**
   * Build signature từ options để match variants
   * Signature = sắp xếp theo typeIndex và join typeId:value
   */
  private buildOptionSignature(options: DeepPartial<ProductOption>[]): string {
    return options
      .slice()
      .sort((a, b) => (a.typeIndex || 0) - (b.typeIndex || 0))
      .map((o) => `${o.typeId}:${o.value}`)
      .join("|");
  }

  /**
   * Build signature từ variant (đã có options với type)
   */
  private buildOptionSignatureFromVariant(variant: ProductVariant): string {
    const options = variant.options || [];
    return options
      .slice()
      .sort((a, b) => (a.typeIndex || 0) - (b.typeIndex || 0))
      .map((o) => `${o.typeId}:${o.value}`)
      .join("|");
  }

  /**
   * Normalize header từ tên cột sang field name
   */
  private readonly headerToFieldMap: Record<string, ProductKey> =
    Object.fromEntries(PRODUCT_COLUMNS.map((c) => [c.header, c.field]));

  private normalizeHeader(header: string): ProductKey | undefined {
    return this.headerToFieldMap[header];
  }

  /**
   * Map field name sang column letter trong Excel
   */
  private fieldToColumnMap: Map<ProductKey, string> = new Map();

  /**
   * Generate error file với highlight và comment
   */
  async generateErrorFile(
    originalWorkbook: ExcelJS.Workbook,
    errors: ImportError[],
  ): Promise<string> {
    const worksheet = originalWorkbook.getWorksheet("Products");
    if (!worksheet) {
      throw new Error("Không tìm thấy sheet 'Products'");
    }

    // Build field to column map từ header row
    this.fieldToColumnMap.clear();
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const header = cell.value?.toString() || "";
      const field = this.normalizeHeader(header);
      if (field) {
        this.fieldToColumnMap.set(field, this.getColumnLetter(colNumber));
      }
    });

    // Group errors by row and field
    const errorMap = new Map<number, Map<string, ImportError[]>>();
    for (const error of errors) {
      if (!errorMap.has(error.row)) {
        errorMap.set(error.row, new Map());
      }
      const rowErrors = errorMap.get(error.row)!;
      const field = error.field || "_general";
      if (!rowErrors.has(field)) {
        rowErrors.set(field, []);
      }
      rowErrors.get(field)!.push(error);
    }

    // Apply formatting and comments
    errorMap.forEach((fieldErrors, rowNumber) => {
      const row = worksheet.getRow(rowNumber);

      fieldErrors.forEach((errors, field) => {
        if (field === "_general") {
          // General error - highlight entire row
          row.eachCell((cell) => {
            this.highlightCell(cell, errors);
          });
        } else {
          // Field specific error
          const columnLetter = this.fieldToColumnMap.get(field as ProductKey);
          if (columnLetter) {
            const cell = row.getCell(columnLetter);
            this.highlightCell(cell, errors);
          }
        }
      });
    });

    // Save to temp folder
    const filename = `errors_${Date.now()}.xlsx`;
    const tempDir = path.join(process.cwd(), "uploads", "temp", "errors");
    await fs.mkdir(tempDir, { recursive: true });

    const filePath = path.join(tempDir, filename);
    await originalWorkbook.xlsx.writeFile(filePath);

    // Return relative URL
    return `/uploads/temp/errors/${filename}`;
  }

  /**
   * Highlight cell với màu đỏ và thêm comment
   */
  private highlightCell(cell: ExcelJS.Cell, errors: ImportError[]): void {
    // Set red background
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF0000" }, // Red
    };

    // Set white text for readability
    cell.font = {
      ...cell.font,
      color: { argb: "FFFFFFFF" },
      bold: true,
    };

    // Add comment with all error messages
    const commentText = errors.map((e) => e.message).join("\n");
    cell.note = {
      texts: [
        {
          font: { size: 10, name: "Arial" },
          text: commentText,
        },
      ],
    };
  }

  /**
   * Convert column number to letter (1 -> A, 27 -> AA)
   */
  private getColumnLetter(columnNumber: number): string {
    let letter = "";
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }
}
