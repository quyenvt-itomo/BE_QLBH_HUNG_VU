import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import {
  JOB_POSITION_COLUMNS,
  JOB_POSITION_SHEET_NAMES,
} from "./jobPosition.excel.types";
import { JOB_POSITION_TYPES } from "../../jobPosition/jobPosition.types";
import { JobPositionService } from "../../jobPosition/jobPosition.service";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";

@injectable()
export class JobPositionExcelTemplate {
  constructor(
    @inject(JOB_POSITION_TYPES.JobPositionService)
    private jobPositionService: JobPositionService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(JOB_POSITION_SHEET_NAMES.MAIN);
    sheet.columns = JOB_POSITION_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow({
      name: "Giám đốc",
      level: "Cấp cao",
      jobTitleName: "Giám đốc điều hành",
    });

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP VỊ TRÍ CÔNG VIỆC"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 1 sheet. Dòng 1 là tiêu đề cột (màu xanh). Nhập dữ liệu từ dòng 2 trở đi.",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 CÁC CỘT QUAN TRỌNG:"]);
    inst.addRow(["  • Tên vị trí (*) là bắt buộc"]);
    inst.addRow([
      "  • Cấp bậc: nhập số hoặc text (VD: 1, 2, Trưởng phòng, Nhân viên...)",
    ]);
    inst.addRow([
      "  • Chức danh (jobTitleName): tên chức danh — nếu chưa có, hệ thống sẽ tự tạo mới",
    ]);
    inst.addRow(["  • VD: Giám đốc kinh doanh | Cấp 1 | Giám đốc | Ghi chú"]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow(["  • Tên vị trí phải là duy nhất trong công ty"]);
    inst.addRow(["  • Khi import UPDATE: cập nhật toàn bộ thông tin vị trí"]);
    inst.addRow([
      "  • Khi import SKIP: nếu tên vị trí đã tồn tại, dòng đó sẽ bị bỏ qua",
    ]);

    logger.info("[JobPosition Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const result = await this.jobPositionService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const positions = result.data || [];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(JOB_POSITION_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : JOB_POSITION_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    for (const p of positions) {
      sheet.addRow({
        name: p.name,
        level: p.level || "",
        jobTitleName: p.jobTitle?.name || p.jobTitleSnapshot?.name || "",
        note: p.note || "",
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
