import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats } from "../excel.dropdown";
import {
  PARTNER_COLUMNS,
  PARTNER_SHEET_NAMES,
  partnerTypeMap,
} from "./partner.excel.types";
import { PARTNER_TYPES } from "../../partner/partner.types";
import { PartnerService } from "../../partner/partner.service";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";

@injectable()
export class PartnerExcelTemplate {
  constructor(
    @inject(PARTNER_TYPES.PartnerService)
    private partnerService: PartnerService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet(PARTNER_SHEET_NAMES.MAIN);
    sheet.columns = PARTNER_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow({
      code: "KH001",
      name: "Công ty TNHH ABC",
      types: "Khách hàng",
      groupName: "Khách VIP",
      taxCode: "0123456789",
      phone: "0901234567",
      email: "abc@example.com",
      staffCode: "NV001",
      note: "Khách hàng thân thiết",
    });
    applyColumnFormats(sheet, PARTNER_COLUMNS);

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP ĐỐI TÁC"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 1 sheet. Dòng 1 là tiêu đề cột (màu xanh). Nhập dữ liệu từ dòng 2 trở đi.",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 CÁC CỘT QUAN TRỌNG:"]);
    inst.addRow(["  • Mã ĐT (*), Tên ĐT (*), Loại ĐT (*) là bắt buộc"]);
    inst.addRow(["  • Loại ĐT: có thể nhập nhiều loại cách nhau bởi dấu phẩy"]);
    inst.addRow(["    VD: Khách hàng, Nhà cung cấp"]);
    inst.addRow([
      "  • groupName: Nhóm đối tác — nếu chưa có, hệ thống sẽ tự tạo mới",
    ]);
    inst.addRow([
      "  • staffCode: Mã nhân viên phụ trách — hệ thống sẽ tự tìm theo mã NV",
    ]);
    inst.addRow([
      "  • paymentTermName: Điều khoản thanh toán — hệ thống sẽ tự tìm theo tên",
    ]);
    inst.addRow([
      "    VD: PN001 | Công ty TNHH ABC | Khách hàng | Nhóm VIP | 0123456789 | ...",
    ]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow([
      "  • Khi import UPDATE: cập nhật toàn bộ thông tin đối tác (kể cả danh bạ nếu có)",
    ]);
    inst.addRow([
      "  • Khi import SKIP: nếu mã ĐT đã tồn tại, dòng đó sẽ bị bỏ qua",
    ]);
    inst.addRow([""]);
    inst.addRow(["Loại đối tác:", ...Object.values(partnerTypeMap)]);

    logger.info("[Partner Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const result = await this.partnerService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const partners = result.data || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(PARTNER_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : PARTNER_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));

    for (const p of partners) {
      sheet.addRow({
        code: p.code,
        name: p.name,
        types: (p.types || [])
          .map((t: string) => partnerTypeMap[t] || t)
          .join(", "),
        groupName: p.group?.name || "",
        taxCode: p.taxCode || "",
        phone: p.phone || "",
        email: p.email || "",
        staffCode: p.staff?.code || "",
        paymentTermName: p.paymentTerm?.name || "",
        address: p.address?.detail || "",
        representativeName: p.representative?.name || "",
        representativePhone: p.representative?.phone || "",
        bankName: p.banks?.[0]?.bankName || "",
        bankAccount: p.banks?.[0]?.accountNumber || "",
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
