import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import {
  WAREHOUSE_COLUMNS,
  WAREHOUSE_SHEET_NAMES,
} from "./warehouse.excel.types";
import { WAREHOUSE_TYPES } from "../../warehouse/warehouse.types";
import { WarehouseService } from "../../warehouse/warehouse.service";
import { RequestContext } from "@/shared/types/interfaces";
import { applyColumnFormats } from "../excel.dropdown";
import logger from "@/shared/utils/logger";

@injectable()
export class WarehouseExcelTemplate {
  constructor(
    @inject(WAREHOUSE_TYPES.WarehouseService)
    private warehouseService: WarehouseService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(WAREHOUSE_SHEET_NAMES.MAIN);
    sheet.columns = WAREHOUSE_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow({
      code: "KHO01",
      name: "Kho tổng",
      phone: "0901234567",
      address: "123 Nguyễn Huệ, Q1, TP.HCM",
      note: "Kho chính",
    });
    applyColumnFormats(sheet, WAREHOUSE_COLUMNS);

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP KHO"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 1 sheet. Dòng 1 là tiêu đề cột (màu xanh). Nhập dữ liệu từ dòng 2 trở đi.",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 CÁC CỘT QUAN TRỌNG:"]);
    inst.addRow(["  • Mã kho (*), Tên kho (*) là bắt buộc"]);
    inst.addRow([
      "  • managerCode: Mã nhân viên quản lý kho — hệ thống sẽ tự tìm theo mã NV",
    ]);
    inst.addRow([
      "  • VD: KHO01 | Kho nguyên liệu | 0901234567 | 123 Nguyễn Huệ, P.1, TP.HCM | NV001 | Ghi chú",
    ]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow(["  • Mã kho phải là duy nhất trong công ty"]);
    inst.addRow(["  • Khi import UPDATE: cập nhật toàn bộ thông tin kho"]);
    inst.addRow([
      "  • Khi import SKIP: nếu mã kho đã tồn tại, dòng đó sẽ bị bỏ qua",
    ]);

    logger.info("[Warehouse Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const result = await this.warehouseService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const warehouses = result.data || [];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(WAREHOUSE_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : WAREHOUSE_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    for (const w of warehouses) {
      sheet.addRow({
        code: w.code,
        name: w.name,
        phone: w.phone || "",
        address: w.address?.detail || "",
        managerCode: w.manager?.code || "",
        note: w.note || "",
      });
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
