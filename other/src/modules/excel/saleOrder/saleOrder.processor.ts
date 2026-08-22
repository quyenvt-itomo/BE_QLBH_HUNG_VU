import { injectable, inject } from "inversify";
import { Request } from "express";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult, ImportError } from "../excel.types";
import logger from "@/shared/utils/logger";
import {
  SALE_ORDER_COLUMNS,
  OrderKey,
  OrderLineKey,
  RawSaleOrderRow,
} from "./saleOrder.types";
import { DatabaseConfig } from "@/config/database";
import {
  ValidatedSaleOrderRow,
  SaleOrderRowSchema,
} from "./saleOrder.validator";
import { Partner } from "@/database/models/Partner";
import { Employee } from "@/database/models/store/Employee";
import {
  OrderTypeEnum,
  DiscountTypeEnum,
  OrderLineTypeEnum,
} from "@/shared/constants/enum";
import { PARTNER_TYPES, PartnerRepository } from "@/modules/partner";
import {
  PRODUCT_VARIANT_TYPES,
  ProductVariantRepository,
} from "@/modules/product";
import { ORDER_TYPES, OrderService } from "@/modules/order";

interface GroupedOrder {
  orderCode: string;
  orderData: Partial<ValidatedSaleOrderRow>;
  lines: Array<{
    rowNumber: number;
    data: ValidatedSaleOrderRow;
  }>;
  rowNumbers: number[];
}

/**
 * SaleOrder Excel Processor
 * Xử lý import đơn bán hàng từ file Excel
 * Template: thông tin order ở bên trái, orderLine ở bên phải
 * Nhiều dòng cùng mã order => 1 order với nhiều lines
 */
@injectable()
export class SaleOrderExcelProcessor {
  constructor(
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepo: PartnerRepository,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepo: ProductVariantRepository,
    @inject(ORDER_TYPES.OrderService)
    private orderService: OrderService,
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
    const worksheet = workbook.getWorksheet("SaleOrders");
    if (!worksheet) {
      throw new Error("Không tìm thấy sheet 'SaleOrders' trong file Excel");
    }

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
          label: "Tính toán công nợ",
          progress: 0,
          status: "pending",
        },
      ],
    };

    // Parse rows từ Excel
    const rawRows = this.parseWorksheet(worksheet);
    result.totalRows = rawRows.length;

    if (result.totalRows === 0) {
      logger.warn("[Excel Import - SaleOrder] No rows to process");
      return result;
    }

    // ===== LAYER 1: VALIDATION =====
    result.layers![0].status = "processing";
    if (onProgress) onProgress(result);

    const { validatedRows, errors: validationErrors } = await this.validateRows(
      rawRows,
      result,
      onProgress,
    );

    result.errors.push(...validationErrors);

    if (result.layers) {
      result.layers[0].progress = 100;
      result.layers[0].status =
        validationErrors.length > 0 ? "completed" : "completed";
    }
    if (onProgress) onProgress(result);

    // Short-circuit nếu stop on error và có lỗi
    if (
      options.errorHandling === "stop_on_error" &&
      validationErrors.length > 0
    ) {
      logger.warn(
        "[Excel Import - SaleOrder] Stopping due to validation errors",
      );
      return result;
    }

    // ===== LAYER 2: IMPORT =====
    result.layers![1].status = "processing";
    result.layers![1].progress = 0;
    if (onProgress) onProgress(result);

    // Group rows by order code
    const groupedOrders = this.groupRowsByOrder(validatedRows);

    await this.processOrders(groupedOrders, options, result, onProgress, req);

    if (result.layers) {
      result.layers[1].progress = 100;
      result.layers[1].status = "completed";
    }
    if (onProgress) onProgress(result);

    // ===== LAYER 3: RECALCULATION =====
    if (result.successRows > 0 && options.storeId) {
      result.layers![2].status = "processing";
      result.layers![2].progress = 0;
      if (onProgress) onProgress(result);

      // TODO: Calculate debt, loyalty points, etc.
      // For now, just mark as completed
      result.layers![2].progress = 100;
      result.layers![2].status = "completed";
      if (onProgress) onProgress(result);
    } else {
      result.layers![2].status = "completed";
      if (onProgress) onProgress(result);
    }

    return result;
  }

  /**
   * Parse worksheet thành raw rows
   */
  private parseWorksheet(worksheet: ExcelJS.Worksheet): RawSaleOrderRow[] {
    const rows: RawSaleOrderRow[] = [];
    let headerRowIndex = -1;

    // Tìm header row
    worksheet.eachRow((row, rowNumber) => {
      const firstCell = row.getCell(1).value;
      if (
        firstCell &&
        typeof firstCell === "string" &&
        firstCell.includes("Mã đơn hàng")
      ) {
        headerRowIndex = rowNumber;
        return;
      }
    });

    if (headerRowIndex === -1) {
      logger.warn("[Excel Import - SaleOrder] Header row not found");
      return rows;
    }

    // Parse data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      // Skip empty rows - check if all cells are empty
      let hasData = false;
      row.eachCell((cell) => {
        if (
          cell.value !== null &&
          cell.value !== undefined &&
          cell.value !== ""
        ) {
          hasData = true;
        }
      });
      if (!hasData) return;

      const rowData: any = { _rowNumber: rowNumber };

      SALE_ORDER_COLUMNS.forEach((col, colIndex) => {
        const cellValue = row.getCell(colIndex + 1).value;
        rowData[col.field] = this.parseCellValue(cellValue, col.type);
      });

      rows.push(rowData as RawSaleOrderRow);
    });

    logger.info(`[Excel Import - SaleOrder] Parsed ${rows.length} rows`);
    return rows;
  }

  /**
   * Parse cell value theo type
   */
  private parseCellValue(value: any, type?: string): any {
    if (value === null || value === undefined || value === "") return null;

    switch (type) {
      case "number":
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
          return isNaN(parsed) ? null : parsed;
        }
        return null;

      case "boolean":
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const lower = value.toLowerCase().trim();
          return ["true", "yes", "có", "co", "1", "x"].includes(lower);
        }
        return false;

      case "date":
        if (value instanceof Date) return value;
        if (typeof value === "string") {
          const parsed = new Date(value);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;

      default:
        if (typeof value === "object" && "text" in value) {
          return value.text;
        }
        return value?.toString() || null;
    }
  }

  /**
   * Validate rows
   */
  private async validateRows(
    rawRows: RawSaleOrderRow[],
    result: ImportResult,
    onProgress?: (progress: ImportResult) => void,
  ): Promise<{
    validatedRows: ValidatedSaleOrderRow[];
    errors: ImportError[];
  }> {
    const validatedRows: ValidatedSaleOrderRow[] = [];
    const errors: ImportError[] = [];
    let lastEmittedKey = "";

    const emitProgressIfChanged = () => {
      const currentKey =
        result.layers
          ?.map((l) => `${l.label}:${l.progress}:${l.status}`)
          .join("|") || "";
      if (currentKey !== lastEmittedKey) {
        lastEmittedKey = currentKey;
        if (onProgress) onProgress(result);
      }
    };

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];

      // Update progress
      if (result.layers) {
        result.layers[0].progress = Math.round(
          ((i + 1) / rawRows.length) * 100,
        );
      }
      emitProgressIfChanged();

      try {
        const validated = SaleOrderRowSchema.parse(rawRow);
        validatedRows.push(validated);
      } catch (error: any) {
        result.errorRows++;
        const zodErrors = error.errors || [];
        const errorMessages = zodErrors
          .map((err: any) => `${err.path.join(".")}: ${err.message}`)
          .join("; ");

        errors.push({
          row: rawRow._rowNumber,
          field: zodErrors[0]?.path?.join(".") || "unknown",
          message: errorMessages || "Validation error",
          value: JSON.stringify(rawRow).substring(0, 100),
        });

        logger.debug(
          `[Excel Import - SaleOrder] Validation error at row ${rawRow._rowNumber}:`,
          errorMessages,
        );
      }
    }

    logger.info(
      `[Excel Import - SaleOrder] Validated ${validatedRows.length}/${rawRows.length} rows successfully`,
    );

    return { validatedRows, errors };
  }

  /**
   * Group rows by order code
   */
  private groupRowsByOrder(
    validatedRows: ValidatedSaleOrderRow[],
  ): GroupedOrder[] {
    const orderMap = new Map<string, GroupedOrder>();

    validatedRows.forEach((row) => {
      const orderCode = row[OrderKey.CODE];

      if (!orderMap.has(orderCode)) {
        orderMap.set(orderCode, {
          orderCode,
          orderData: {
            [OrderKey.CODE]: row[OrderKey.CODE],
            [OrderKey.PARTNER_CODE]: row[OrderKey.PARTNER_CODE],
            [OrderKey.PARTNER_NAME]: row[OrderKey.PARTNER_NAME],
            [OrderKey.PARTNER_PHONE]: row[OrderKey.PARTNER_PHONE],
            [OrderKey.EMPLOYEE_CODE]: row[OrderKey.EMPLOYEE_CODE],
            [OrderKey.ORDER_AT]: row[OrderKey.ORDER_AT],
            [OrderKey.DISCOUNT_TYPE]: row[OrderKey.DISCOUNT_TYPE],
            [OrderKey.DISCOUNT_VALUE]: row[OrderKey.DISCOUNT_VALUE],
            [OrderKey.SHIPPING_PROVIDER_CODE]:
              row[OrderKey.SHIPPING_PROVIDER_CODE],
            [OrderKey.SHIPPING_FEE]: row[OrderKey.SHIPPING_FEE],
            [OrderKey.IS_FREE_SHIPPING]: row[OrderKey.IS_FREE_SHIPPING],
            [OrderKey.LOYALTY_POINTS_USED]: row[OrderKey.LOYALTY_POINTS_USED],
          },
          lines: [],
          rowNumbers: [],
        });
      }

      const group = orderMap.get(orderCode)!;
      group.lines.push({
        rowNumber: row._rowNumber,
        data: row,
      });
      group.rowNumbers.push(row._rowNumber);
    });

    const grouped = Array.from(orderMap.values());
    logger.info(
      `[Excel Import - SaleOrder] Grouped into ${grouped.length} orders`,
    );
    return grouped;
  }

  /**
   * Process orders
   */
  private async processOrders(
    groupedOrders: GroupedOrder[],
    options: ImportOptions,
    result: ImportResult,
    onProgress?: (progress: ImportResult) => void,
    req?: any,
  ): Promise<void> {
    let lastEmittedKey = "";

    const emitProgressIfChanged = () => {
      const currentKey =
        result.layers
          ?.map((l) => `${l.label}:${l.progress}:${l.status}`)
          .join("|") || "";
      if (currentKey !== lastEmittedKey) {
        lastEmittedKey = currentKey;
        if (onProgress) onProgress(result);
      }
    };

    for (let i = 0; i < groupedOrders.length; i++) {
      const group = groupedOrders[i];

      // Update progress
      if (result.layers) {
        result.layers[1].progress = Math.round(
          ((i + 1) / groupedOrders.length) * 100,
        );
      }
      emitProgressIfChanged();

      try {
        await this.processOneOrder(group, options, result, req);
        result.successRows += group.lines.length;
      } catch (error: any) {
        logger.error(
          `[Excel Import - SaleOrder] Error processing order ${group.orderCode}:`,
          error,
        );

        result.errorRows += group.lines.length;
        group.rowNumbers.forEach((rowNum) => {
          result.errors.push({
            row: rowNum,
            field: "order",
            message: error.message || "Unknown error",
            value: group.orderCode,
          });
        });

        if (options.errorHandling === "stop_on_error") {
          throw error;
        }
      }
    }
  }

  /**
   * Process one order with all its lines
   */
  private async processOneOrder(
    group: GroupedOrder,
    options: ImportOptions,
    result: ImportResult,
    req: Request,
  ): Promise<void> {
    const { orderData, lines } = group;

    // Lookup partner
    const partner = await this.partnerRepo.findOne({
      where: { code: orderData[OrderKey.PARTNER_CODE] as string },
    });

    if (!partner) {
      throw new Error(
        `Không tìm thấy khách hàng với mã: ${orderData[OrderKey.PARTNER_CODE]}`,
      );
    }

    // Lookup employee (optional)
    let employee: Employee | null = null;
    if (orderData[OrderKey.EMPLOYEE_CODE]) {
      const employeeRepo = DatabaseConfig.getRepository(Employee);
      employee = await employeeRepo.findOne({
        where: { code: orderData[OrderKey.EMPLOYEE_CODE] as string },
      });

      if (!employee) {
        logger.warn(
          `[Excel Import - SaleOrder] Employee not found: ${orderData[OrderKey.EMPLOYEE_CODE]}`,
        );
      }
    }

    // Lookup shipping provider (optional)
    let shippingProvider: Partner | null = null;
    if (orderData[OrderKey.SHIPPING_PROVIDER_CODE]) {
      shippingProvider = await this.partnerRepo.findOne({
        where: { code: orderData[OrderKey.SHIPPING_PROVIDER_CODE] as string },
      });

      if (!shippingProvider) {
        logger.warn(
          `[Excel Import - SaleOrder] Shipping provider not found: ${orderData[OrderKey.SHIPPING_PROVIDER_CODE]}`,
        );
      }
    }

    // Build order lines
    const orderLines: any[] = [];
    for (const line of lines) {
      const productVariantCode = line.data[OrderLineKey.PRODUCT_VARIANT_CODE];

      // Lookup product variant by SKU
      const productVariant = await this.productVariantRepo.findOne({
        where: { sku: productVariantCode },
        relations: [
          "product",
          "product.category",
          "product.unit",
          "options",
          "options.type",
        ],
      });

      if (!productVariant || !productVariant.product) {
        throw new Error(
          `Không tìm thấy sản phẩm với mã: ${productVariantCode} (dòng ${line.rowNumber})`,
        );
      }

      const product = productVariant.product;

      // Build specification from options
      const specification =
        productVariant.options
          ?.map((opt) => `${opt.type?.name || ""}: ${opt.value}`)
          .join(" - ") || null;

      // Build product variant snapshot
      const productVariantSnapshot = {
        id: productVariant.id,
        code: product.code, // Use product code
        name: product.name,
        sku: productVariant.sku,
        barcode: productVariant.barcode,
        specification: specification,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
          category: product.category
            ? {
                id: product.category.id,
                name: product.category.name,
              }
            : null,
          unit: product.unit
            ? {
                id: product.unit.id,
                name: product.unit.name,
              }
            : null,
        },
      };

      // Calculate line financials
      const unitPrice = line.data[OrderLineKey.UNIT_PRICE];
      const quantity = line.data[OrderLineKey.QUANTITY];
      const subTotal = unitPrice * quantity;

      // Line discount
      const lineDiscountType =
        line.data[OrderLineKey.LINE_DISCOUNT_TYPE] || DiscountTypeEnum.AMOUNT;
      const lineDiscountValue =
        line.data[OrderLineKey.LINE_DISCOUNT_VALUE] || 0;
      let lineDiscountAmount = 0;

      if (lineDiscountValue > 0) {
        if (lineDiscountType === DiscountTypeEnum.PERCENT) {
          lineDiscountAmount = (subTotal * lineDiscountValue) / 100;
        } else {
          lineDiscountAmount = lineDiscountValue;
        }
      }

      // Net amount (before tax, before order discount)
      let netAmount = subTotal - lineDiscountAmount;

      // Tax
      const taxRate = line.data[OrderLineKey.TAX_RATE] || 0;
      const taxAmount = taxRate > 0 ? (netAmount * taxRate) / 100 : 0;

      // Total amount (will be adjusted after order discount allocation)
      const totalAmount = netAmount + taxAmount;

      orderLines.push({
        lineType: OrderLineTypeEnum.NORMAL,
        productVariantId: productVariant.id,
        productVariantSnapshot,
        unitPrice,
        quantity,
        subTotal,
        discountType: lineDiscountType,
        discountValue: lineDiscountValue,
        discountAmount: lineDiscountAmount,
        orderDiscountAmount: 0, // Will be calculated by service
        netAmount,
        taxRate,
        taxAmount,
        totalAmount,
        sortOrder: orderLines.length + 1,
      });
    }

    // Create order via service
    const createOrderDto: any = {
      storeId: options.storeId!,
      type: OrderTypeEnum.SALE,
      code: orderData[OrderKey.CODE] as string,
      partnerId: partner.id,
      employeeId: employee?.id || null,
      orderAt: orderData[OrderKey.ORDER_AT] || new Date(),
      discountType:
        orderData[OrderKey.DISCOUNT_TYPE] || DiscountTypeEnum.AMOUNT,
      discountValue: orderData[OrderKey.DISCOUNT_VALUE] || null,
      shippingProviderId: shippingProvider?.id || null,
      shippingFee: orderData[OrderKey.SHIPPING_FEE] || null,
      isFreeShipping: orderData[OrderKey.IS_FREE_SHIPPING] || false,
      loyaltyPointsUsed: orderData[OrderKey.LOYALTY_POINTS_USED] || 0,
      lines: orderLines,
    };

    // Use transaction to create order
    await DatabaseConfig.transaction(async (manager) => {
      // Service will handle all calculations
      const createdOrder = await this.orderService.create(
        createOrderDto,
        manager,
        req,
      );
      result.data?.push(createdOrder);
    });

    logger.info(
      `[Excel Import - SaleOrder] Created order ${orderData[OrderKey.CODE]} with ${orderLines.length} lines`,
    );
  }
}
