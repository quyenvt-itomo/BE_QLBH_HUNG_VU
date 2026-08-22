import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import {
  PRICE_HISTORY_COLUMNS,
  PRICE_HISTORY_SHEET_NAMES,
} from "./priceHistory.excel.types";
import { PRODUCT_TYPES } from "../../product/product.types";
import { ProductService } from "../../product/product.service";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";

@injectable()
export class PriceHistoryExcelTemplate {
  constructor(
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(PRICE_HISTORY_SHEET_NAMES.MAIN);
    sheet.columns = PRICE_HISTORY_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    logger.info("[PriceHistory Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    // Dùng getPriceHistories của ProductService
    const products = await this.productService.getPriceHistories(
      filters as any,
      req,
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(PRICE_HISTORY_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : PRICE_HISTORY_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));

    for (const p of products) {
      const histories = (p as any).priceHistories || [];
      if (!histories.length) {
        // Vẫn hiển thị sản phẩm dù không có lịch sử
        sheet.addRow({
          productCode: p.code,
          productName: p.name,
          unitName: "",
          pricePerUnit: "",
          createdAt: "",
          note: "",
        });
      }
      for (const h of histories) {
        sheet.addRow({
          productCode: p.code,
          productName: p.name,
          unitName: h.unit?.name || "",
          pricePerUnit: h.pricePerUnit,
          createdAt: h.createdAt
            ? new Date(h.createdAt).toISOString().split("T")[0]
            : "",
          note: "",
        });
      }
    }

    return workbook;
  }

  private formatHeader(row: ExcelJS.Row): void {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    row.alignment = { vertical: "middle", horizontal: "center" };
    row.height = 22;
  }
}
