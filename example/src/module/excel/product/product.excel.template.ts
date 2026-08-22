import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats } from "../excel.dropdown";
import {
  PRODUCT_COLUMNS,
  PRODUCT_SHEET_NAMES,
  EXTRA_UNIT_COLUMNS,
  productTypeMap,
} from "./product.excel.types";
import { PRODUCT_TYPES } from "../../product/product.types";
import { ProductService } from "../../product/product.service";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";

@injectable()
export class ProductExcelTemplate {
  constructor(
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(PRODUCT_SHEET_NAMES.MAIN);
    sheet.columns = PRODUCT_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow({
      code: "TP001",
      name: "Sản phẩm mẫu",
      type: "Thành phẩm",
      groupName: "Nhóm thành phẩm",
      baseUnitName: "Cái",
      price: 100000,
      taxRate: 10,
      isPublic: "Có",
    });
    applyColumnFormats(sheet, PRODUCT_COLUMNS);

    const euSheet = workbook.addWorksheet(PRODUCT_SHEET_NAMES.EXTRA_UNITS);
    euSheet.columns = EXTRA_UNIT_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(euSheet.getRow(1));
    euSheet.addRow({
      productCode: "TP001",
      unitName: "Hộp",
      conversionRate: 10,
      pricePerUnit: 12000,
    });
    applyColumnFormats(euSheet, EXTRA_UNIT_COLUMNS);

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP HÀNG HÓA"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 2 sheet. Dòng 1 là tiêu đề cột (màu xanh). Nhập dữ liệu từ dòng 2 trở đi.",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 1 - HÀNG HÓA: Thông tin chính"]);
    inst.addRow(["  • Cột (*) là bắt buộc: mã HH, tên HH, loại"]);
    inst.addRow([
      "  • groupName: tên nhóm hàng hóa — nếu chưa có, hệ thống sẽ tự tạo mới",
    ]);
    inst.addRow([
      "  • baseUnitName: đơn vị tính cơ bản — nếu chưa có, hệ thống sẽ tự tạo mới",
    ]);
    inst.addRow(["  • isPublic: nhập 'Có' hoặc để trống (mặc định là Không)"]);
    inst.addRow([
      "  • VD: HH001 | Thép D10 | Thành phẩm | Nhóm thép | Kg | 15000 | 10 | Có | Ghi chú",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 2 - ĐƠN VỊ TÍNH PHỤ: Đơn vị quy đổi"]);
    inst.addRow([
      "  • Mỗi dòng là 1 đơn vị quy đổi, gắn với mã hàng hóa ở cột đầu",
    ]);
    inst.addRow([
      "  • unitName: tên đơn vị tính phụ — nếu chưa có, hệ thống sẽ tự tạo mới",
    ]);
    inst.addRow([
      "  • conversionRate: tỷ lệ quy đổi từ ĐVT cơ bản (VD: 1 Tấn = 1000 Kg → rate = 0.001)",
    ]);
    inst.addRow(["  • VD: HH001 | Tấn | 0.001 | 15000000"]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow([
      "  • Khi import UPDATE: hệ thống xoá hết đơn vị tính phụ cũ rồi tạo mới từ sheet 2",
    ]);
    inst.addRow([
      "  • Khi import SKIP: nếu mã HH đã tồn tại, dòng đó sẽ bị bỏ qua",
    ]);
    inst.addRow([""]);
    inst.addRow(["Loại hàng hóa:", ...Object.values(productTypeMap)]);

    logger.info("[Product Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
    extraUnitColumns?: ExportColumnConfig[],
  ): Promise<ExcelJS.Workbook> {
    const result = await this.productService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const products = result.data || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(PRODUCT_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : PRODUCT_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));

    // Map product code → row number (để tạo hyperlink từ sheet phụ)
    const productRowMap = new Map<string, number>();
    let mainRowIdx = 2; // data bắt đầu từ row 2

    for (const p of products) {
      const typeLabel = productTypeMap[p.type as string] || p.type;
      sheet.addRow({
        code: p.code,
        name: p.name,
        type: typeLabel,
        groupName: p.group?.name || "",
        baseUnitName: p.baseUnit?.name || "",
        price: p.price,
        taxRate: p.taxRate,
        isPublic: p.isPublic ? "Có" : "Không",
        note: p.note || "",
      });
      productRowMap.set(p.code, mainRowIdx);
      mainRowIdx++;
    }

    // Extra units sheet (nếu sản phẩm có đơn vị quy đổi)
    const euSheet = workbook.addWorksheet(PRODUCT_SHEET_NAMES.EXTRA_UNITS);
    const euCols =
      extraUnitColumns && extraUnitColumns.length > 0
        ? extraUnitColumns
        : EXTRA_UNIT_COLUMNS;
    euSheet.columns = euCols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(euSheet.getRow(1));

    for (const p of products) {
      for (const eu of p.extraUnits || []) {
        const row = euSheet.addRow({
          productCode: p.code,
          unitName: eu.unit?.name || "",
          conversionRate: eu.conversionRate,
          pricePerUnit: eu.pricePerUnit,
        });
        // Hyperlink: click mã ở sheet phụ → nhảy đến dòng tương ứng ở sheet chính
        const mainRow = productRowMap.get(p.code);
        if (mainRow) {
          this.setHyperlink(
            row.getCell(1),
            p.code,
            PRODUCT_SHEET_NAMES.MAIN,
            `A${mainRow}`,
          );
        }
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

  /**
   * Thiết lập hyperlink cho cell: click vào sẽ nhảy đến dòng tương ứng trong sheet đích.
   */
  private setHyperlink(
    cell: ExcelJS.Cell,
    displayText: string,
    targetSheet: string,
    targetCell: string,
  ): void {
    cell.value = {
      text: displayText,
      hyperlink: `#'${targetSheet}'!${targetCell}`,
    };
    cell.font = {
      color: { argb: "FF0563C1" },
      underline: true,
    };
  }
}
