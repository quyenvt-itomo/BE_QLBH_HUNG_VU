import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats } from "../excel.dropdown";
import { USER_COLUMNS, USER_SHEET_NAMES } from "./user.excel.types";
import { USER_TYPES } from "../../user/user.types";
import { UserService } from "../../user/user.service";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";

@injectable()
export class UserExcelTemplate {
  constructor(
    @inject(USER_TYPES.UserService) private userService: UserService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(USER_SHEET_NAMES.MAIN);
    sheet.columns = USER_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow({
      code: "USR001",
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      phone: "0901234567",
      isActive: "Có",
      note: "Tài khoản quản trị",
    });
    applyColumnFormats(sheet, USER_COLUMNS);

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP NGƯỜI DÙNG"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 1 sheet. Dòng 1 là tiêu đề cột (màu xanh). Nhập dữ liệu từ dòng 2 trở đi.",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 CÁC CỘT QUAN TRỌNG:"]);
    inst.addRow(["  • Mã ND (*), Tên ND (*), Tên đăng nhập (*) là bắt buộc"]);
    inst.addRow([
      "  • isActive: nhập 'Có' để kích hoạt, để trống hoặc 'Không' để vô hiệu",
    ]);
    inst.addRow([
      "  • sourceStoreName: Tên công ty nguồn — hệ thống sẽ tự tìm theo tên",
    ]);
    inst.addRow([
      "  • VD: ND001 | Nguyễn Văn A | nva | nva@company.com | 0901234567 | Có | Công ty ABC | Ghi chú",
    ]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow([
      "  • Tên đăng nhập (username) phải là duy nhất trong hệ thống",
    ]);
    inst.addRow([
      "  • Khi import UPDATE: cập nhật toàn bộ thông tin người dùng",
    ]);
    inst.addRow([
      "  • Khi import SKIP: nếu username đã tồn tại, dòng đó sẽ bị bỏ qua",
    ]);

    logger.info("[User Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const result = await this.userService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const users = result.data || [];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(USER_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : USER_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    for (const u of users) {
      sheet.addRow({
        code: u.code,
        name: u.name,
        username: u.username,
        email: u.email || "",
        phone: u.phone || "",
        isActive: u.isActive ? "Có" : "Không",
        sourceStoreName: u.sourceStore?.name || "",
        note: u.note || "",
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
