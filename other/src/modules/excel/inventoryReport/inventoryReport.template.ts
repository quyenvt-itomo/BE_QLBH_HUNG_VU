import ExcelJS from "exceljs";
import { injectable, inject } from "inversify";
import logger from "@/shared/utils/logger";
import { INVENTORY_TYPES, InventoryService } from "@/modules/inventory";
import { Request } from "express";
import { ExportColumnConfig } from "../excel.types";

enum InventoryReportKey {
  CODE = "code",
  NAME = "name",
  CATEGORY_NAME = "categoryName",
  UNIT_NAME = "unitName",
  OPENING_QTY = "openingQty",
  OPENING_AMOUNT = "openingAmount",
  INCREASE_QTY = "increaseQty",
  INCREASE_AMOUNT = "increaseAmount",
  DECREASE_QTY = "decreaseQty",
  DECREASE_AMOUNT = "decreaseAmount",
  CLOSING_QTY = "closingQty",
  CLOSING_AMOUNT = "closingAmount",
}

const INVENTORY_REPORT_COLUMNS: ExportColumnConfig[] = [
  {
    field: InventoryReportKey.CODE,
    header: "Mã hàng",
    width: 15,
    type: "string",
  },
  {
    field: InventoryReportKey.NAME,
    header: "Tên hàng hóa",
    width: 30,
    type: "string",
  },
  {
    field: InventoryReportKey.CATEGORY_NAME,
    header: "Danh mục",
    width: 20,
    type: "string",
  },
  {
    field: InventoryReportKey.UNIT_NAME,
    header: "ĐVT",
    width: 12,
    type: "string",
  },
  {
    field: InventoryReportKey.OPENING_QTY,
    header: "Tồn đầu kỳ - Số lượng",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.OPENING_AMOUNT,
    header: "Tồn đầu kỳ - Giá trị",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.INCREASE_QTY,
    header: "Nhập trong kỳ - Số lượng",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.INCREASE_AMOUNT,
    header: "Nhập trong kỳ - Giá trị",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.DECREASE_QTY,
    header: "Xuất trong kỳ - Số lượng",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.DECREASE_AMOUNT,
    header: "Xuất trong kỳ - Giá trị",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.CLOSING_QTY,
    header: "Tồn cuối kỳ - Số lượng",
    width: 18,
    type: "number",
  },
  {
    field: InventoryReportKey.CLOSING_AMOUNT,
    header: "Tồn cuối kỳ - Giá trị",
    width: 18,
    type: "number",
  },
];

@injectable()
export class InventoryReportExcelTemplate {
  constructor(
    @inject(INVENTORY_TYPES.InventoryService)
    private inventoryService: InventoryService,
  ) {}

  /**
   * Export báo cáo tồn kho sang Excel
   */
  async exportData(
    req: Request,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("InventoryReport");
    // Setup columns
    const columnDefs =
      columns.length > 0
        ? columns.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }))
        : INVENTORY_REPORT_COLUMNS.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }));

    worksheet.columns = columnDefs;

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2196F3" }, // Màu xanh dương cho báo cáo tồn kho
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Query inventory report từ service
    const reportResult = await this.inventoryService.getStockReport({
      ...filters,
      page: 1,
      size: 1000000,
    } as any);

    // Flatten products và variants thành rows
    const rows: any[] = [];
    if (reportResult.data && Array.isArray(reportResult.data)) {
      reportResult.data.forEach((product: any) => {
        if (
          product.variants &&
          Array.isArray(product.variants) &&
          product.variants.length > 0
        ) {
          // Sản phẩm có variants - trải phẳng từng variant
          product.variants.forEach((variant: any) => {
            const specification = variant.options
              ?.map((opt: any) => `${opt.type?.name}: ${opt.value}`)
              .join(" - ");

            rows.push({
              code: variant.sku || product.code,
              name: product.name,
              specification: specification || "",
              categoryName: product.category?.name || "",
              unitName: product.unit?.name || "",
              openingQty: variant.openingQty || 0,
              openingAmount: variant.openingAmount || 0,
              increaseQty: variant.increaseQty || 0,
              increaseAmount: variant.increaseAmount || 0,
              decreaseQty: variant.decreaseQty || 0,
              decreaseAmount: variant.decreaseAmount || 0,
              closingQty: variant.closingQty || 0,
              closingAmount: variant.closingAmount || 0,
              lastUpdated: product.updatedAt || product.createdAt,
            });
          });
        } else {
          // Sản phẩm không có variants - thêm trực tiếp
          rows.push({
            code: product.code,
            name: product.name,
            specification: "",
            categoryName: product.category?.name || "",
            unitName: product.unit?.name || "",
            openingQty: product.openingQty || 0,
            openingAmount: product.openingAmount || 0,
            increaseQty: product.increaseQty || 0,
            increaseAmount: product.increaseAmount || 0,
            decreaseQty: product.decreaseQty || 0,
            decreaseAmount: product.decreaseAmount || 0,
            closingQty: product.closingQty || 0,
            closingAmount: product.closingAmount || 0,
            lastUpdated: product.updatedAt || product.createdAt,
          });
        }
      });
    }

    // Add data rows
    rows.forEach((row) => {
      worksheet.addRow({
        [InventoryReportKey.CODE]: row.code,
        [InventoryReportKey.NAME]: row.name,
        [InventoryReportKey.CATEGORY_NAME]: row.categoryName,
        [InventoryReportKey.UNIT_NAME]: row.unitName,
        [InventoryReportKey.OPENING_QTY]: row.openingQty,
        [InventoryReportKey.OPENING_AMOUNT]: row.openingAmount,
        [InventoryReportKey.INCREASE_QTY]: row.increaseQty,
        [InventoryReportKey.INCREASE_AMOUNT]: row.increaseAmount,
        [InventoryReportKey.DECREASE_QTY]: row.decreaseQty,
        [InventoryReportKey.DECREASE_AMOUNT]: row.decreaseAmount,
        [InventoryReportKey.CLOSING_QTY]: row.closingQty,
        [InventoryReportKey.CLOSING_AMOUNT]: row.closingAmount,
      });
    });

    // Format number columns
    const numberColumns = [
      InventoryReportKey.OPENING_QTY,
      InventoryReportKey.OPENING_AMOUNT,
      InventoryReportKey.INCREASE_QTY,
      InventoryReportKey.INCREASE_AMOUNT,
      InventoryReportKey.DECREASE_QTY,
      InventoryReportKey.DECREASE_AMOUNT,
      InventoryReportKey.CLOSING_QTY,
      InventoryReportKey.CLOSING_AMOUNT,
    ];

    numberColumns.forEach((field) => {
      const colIndex = INVENTORY_REPORT_COLUMNS.findIndex(
        (col) => col.field === field,
      );
      if (colIndex !== -1) {
        worksheet.getColumn(colIndex + 1).numFmt = "#,##0";
      }
    });

    // Add borders
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add summary row with actual values from service
    if (rows.length > 0 && reportResult.summary) {
      worksheet.addRow({});
      const summaryRow = worksheet.addRow({
        [InventoryReportKey.CODE]: "TỔNG CỘNG",
        [InventoryReportKey.OPENING_QTY]: reportResult.summary.openingQty || 0,
        [InventoryReportKey.OPENING_AMOUNT]:
          reportResult.summary.openingAmount || 0,
        [InventoryReportKey.INCREASE_QTY]:
          reportResult.summary.increaseQty || 0,
        [InventoryReportKey.INCREASE_AMOUNT]:
          reportResult.summary.increaseAmount || 0,
        [InventoryReportKey.DECREASE_QTY]:
          reportResult.summary.decreaseQty || 0,
        [InventoryReportKey.DECREASE_AMOUNT]:
          reportResult.summary.decreaseAmount || 0,
        [InventoryReportKey.CLOSING_QTY]: reportResult.summary.closingQty || 0,
        [InventoryReportKey.CLOSING_AMOUNT]:
          reportResult.summary.closingAmount || 0,
      });

      summaryRow.font = { bold: true };
      summaryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE3F2FD" },
      };
    }

    logger.info(
      `[InventoryReportExcelTemplate] Exported ${rows.length} inventory records`,
    );
    return workbook;
  }
}
