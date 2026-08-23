import ExcelJS from "exceljs";
import { injectable, inject } from "inversify";
import logger from "@/shared/utils/logger";
import {
  INVENTORY_ADJUSTMENT_TYPES,
  InventoryAdjustmentService,
} from "@/modules/inventoryAdjustment";
import { Request } from "express";
import { ExportColumnConfig } from "../excel.types";
import { TimezoneUtils } from "@/shared/utils/timezone.utils";

enum InventoryAdjustmentKey {
  CODE = "code",
  STORE_NAME = "storeName",
  OCCURRED_AT = "occurredAt",
  REASON = "reason",
  TOTAL_ADJUSTMENT_QTY = "totalAdjustmentQty",
  TOTAL_ADJUSTMENT_VALUE = "totalAdjustmentValue",
  IS_INITIAL = "isInitial",
  STAFF_NAME = "staffName",
}

enum InventoryAdjustmentLineKey {
  PRODUCT_VARIANT_CODE = "productVariantCode",
  PRODUCT_VARIANT_NAME = "productVariantName",
  SPECIFICATION = "specification",
  SYSTEM_QTY = "systemQty",
  ACTUAL_QTY = "actualQty",
  ADJUSTMENT_QTY = "adjustmentQty",
  COST_PRICE = "costPrice",
  ADJUSTMENT_VALUE = "adjustmentValue",
}

const INVENTORY_ADJUSTMENT_COLUMNS: ExportColumnConfig[] = [
  {
    field: InventoryAdjustmentKey.CODE,
    header: "Mã phiếu",
    width: 20,
    type: "string",
  },
  {
    field: InventoryAdjustmentKey.STORE_NAME,
    header: "Kho",
    width: 25,
    type: "string",
  },
  {
    field: InventoryAdjustmentKey.OCCURRED_AT,
    header: "Ngày điều chỉnh",
    width: 20,
    type: "date",
  },
  {
    field: InventoryAdjustmentKey.REASON,
    header: "Lý do",
    width: 30,
    type: "string",
  },
  {
    field: InventoryAdjustmentKey.TOTAL_ADJUSTMENT_QTY,
    header: "Tổng SL điều chỉnh",
    width: 18,
    type: "number",
  },
  {
    field: InventoryAdjustmentKey.TOTAL_ADJUSTMENT_VALUE,
    header: "Tổng GT điều chỉnh",
    width: 18,
    type: "number",
  },
  {
    field: InventoryAdjustmentKey.IS_INITIAL,
    header: "Tồn đầu kỳ",
    width: 12,
    type: "boolean",
  },
  {
    field: InventoryAdjustmentKey.STAFF_NAME,
    header: "Nhân viên",
    width: 25,
    type: "string",
  },
  {
    field: InventoryAdjustmentLineKey.PRODUCT_VARIANT_CODE,
    header: "Mã sản phẩm/SKU",
    width: 20,
    type: "string",
  },
  {
    field: InventoryAdjustmentLineKey.PRODUCT_VARIANT_NAME,
    header: "Tên sản phẩm",
    width: 30,
    type: "string",
  },
  {
    field: InventoryAdjustmentLineKey.SPECIFICATION,
    header: "Quy cách",
    width: 25,
    type: "string",
  },
  {
    field: InventoryAdjustmentLineKey.SYSTEM_QTY,
    header: "SL hệ thống",
    width: 15,
    type: "number",
  },
  {
    field: InventoryAdjustmentLineKey.ACTUAL_QTY,
    header: "SL thực tế",
    width: 15,
    type: "number",
  },
  {
    field: InventoryAdjustmentLineKey.ADJUSTMENT_QTY,
    header: "SL điều chỉnh",
    width: 15,
    type: "number",
  },
  {
    field: InventoryAdjustmentLineKey.COST_PRICE,
    header: "Giá vốn",
    width: 15,
    type: "number",
  },
  {
    field: InventoryAdjustmentLineKey.ADJUSTMENT_VALUE,
    header: "GT điều chỉnh",
    width: 18,
    type: "number",
  },
];

@injectable()
export class InventoryAdjustmentExcelTemplate {
  constructor(
    @inject(INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentService)
    private inventoryAdjustmentService: InventoryAdjustmentService,
  ) {}

  /**
   * Export dữ liệu Inventory Adjustments sang Excel
   */
  async exportData(
    req: Request,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("InventoryAdjustments");

    // Setup columns
    const columnDefs =
      columns.length > 0
        ? columns.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }))
        : INVENTORY_ADJUSTMENT_COLUMNS.map((col) => ({
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
      fgColor: { argb: "FF9C27B0" }, // Màu tím cho phiếu kiểm kho
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Query inventory adjustments with lines
    const { data: adjustments } =
      await this.inventoryAdjustmentService.findAllWithPagination({
        where: filters,
        ...filters,
        page: 1,
        size: 100000,
      });

    // Convert adjustments to rows (mỗi line thành 1 row)
    for (const adjustment of adjustments) {
      const lines = adjustment.lines || [];

      for (const line of lines) {
        const variant = line.productVariant;
        const specification = variant?.options
          ?.map((opt: any) => `${opt.type?.name}: ${opt.value}`)
          .join(" - ");

        worksheet.addRow({
          [InventoryAdjustmentKey.CODE]: adjustment.code,
          [InventoryAdjustmentKey.STORE_NAME]: adjustment.store?.name || "",
          [InventoryAdjustmentKey.OCCURRED_AT]: TimezoneUtils.utcToLocal(
            adjustment.occurredAt,
          ),
          [InventoryAdjustmentKey.REASON]: adjustment.reason || "",
          [InventoryAdjustmentKey.TOTAL_ADJUSTMENT_QTY]:
            adjustment.totalAdjustmentQty || 0,
          [InventoryAdjustmentKey.TOTAL_ADJUSTMENT_VALUE]:
            adjustment.totalAdjustmentValue || 0,
          [InventoryAdjustmentKey.IS_INITIAL]: adjustment.isInitial
            ? "Có"
            : "Không",
          [InventoryAdjustmentKey.STAFF_NAME]:
            adjustment.adjustedBySnapshot?.name || "",

          [InventoryAdjustmentLineKey.PRODUCT_VARIANT_CODE]: variant?.sku || "",
          [InventoryAdjustmentLineKey.PRODUCT_VARIANT_NAME]:
            variant?.product?.name || "",
          [InventoryAdjustmentLineKey.SPECIFICATION]: specification || "",
          [InventoryAdjustmentLineKey.SYSTEM_QTY]: line.expectedQty || 0,
          [InventoryAdjustmentLineKey.ACTUAL_QTY]: line.countedQty || 0,
          [InventoryAdjustmentLineKey.ADJUSTMENT_QTY]: line.deltaQty || 0,
          [InventoryAdjustmentLineKey.COST_PRICE]: line.costPriceAtTime || 0,
          [InventoryAdjustmentLineKey.ADJUSTMENT_VALUE]:
            line.adjustmentValue || 0,
        });
      }
    }

    // Format number columns
    const numberColumns = [
      InventoryAdjustmentKey.TOTAL_ADJUSTMENT_QTY,
      InventoryAdjustmentKey.TOTAL_ADJUSTMENT_VALUE,
      InventoryAdjustmentLineKey.SYSTEM_QTY,
      InventoryAdjustmentLineKey.ACTUAL_QTY,
      InventoryAdjustmentLineKey.ADJUSTMENT_QTY,
      InventoryAdjustmentLineKey.COST_PRICE,
      InventoryAdjustmentLineKey.ADJUSTMENT_VALUE,
    ];

    numberColumns.forEach((field) => {
      const colIndex = INVENTORY_ADJUSTMENT_COLUMNS.findIndex(
        (col) => col.field === field,
      );
      if (colIndex !== -1) {
        worksheet.getColumn(colIndex + 1).numFmt = "#,##0";
      }
    });

    // Format date column
    const dateColIndex = INVENTORY_ADJUSTMENT_COLUMNS.findIndex(
      (col) => col.field === InventoryAdjustmentKey.OCCURRED_AT,
    );
    if (dateColIndex !== -1) {
      worksheet.getColumn(dateColIndex + 1).numFmt = "dd/mm/yyyy";
    }

    // Auto-filter
    if (worksheet.columns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length },
      };
    }

    // Format data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
          };
          cell.alignment = { vertical: "middle" };
        });
      }
    });

    logger.info(
      `[InventoryAdjustment Template] Exported ${adjustments.length} adjustments with ${worksheet.rowCount - 1} lines`,
    );
    return workbook;
  }
}
