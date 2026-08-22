import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats } from "../excel.dropdown";
import {
  SERVICE_COLUMNS,
  SERVICE_SHEET_NAMES,
  SERVICE_UNIT_COLUMNS,
  serviceTypeMap,
} from "./service.excel.types";
import { SERVICE_TYPES } from "../../service/service.types";
import { ServiceService } from "../../service/service.service";
import { RequestContext } from "@/shared/types/interfaces";
import logger from "@/shared/utils/logger";

@injectable()
export class ServiceExcelTemplate {
  constructor(
    @inject(SERVICE_TYPES.ServiceService)
    private serviceService: ServiceService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SERVICE_SHEET_NAMES.MAIN);
    sheet.columns = SERVICE_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow({
      code: "DV001",
      name: "Vận chuyển",
      type: "Thuê ngoài",
      taxRate: 10,
      note: "Dịch vụ mẫu",
    });
    applyColumnFormats(sheet, SERVICE_COLUMNS);

    // Units sheet
    this.addUnitsSheet(workbook, [
      {
        serviceCode: "DV001",
        unitName: "Lần",
        costPrice: 300000,
        unitPrice: 500000,
      },
      {
        serviceCode: "DV001",
        unitName: "Km",
        costPrice: 5000,
        unitPrice: 10000,
      },
    ]);

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP DỊCH VỤ"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 2 sheet. Dòng 1 là tiêu đề cột (màu xanh). Nhập dữ liệu từ dòng 2 trở đi.",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 1 - DỊCH VỤ: Thông tin chính"]);
    inst.addRow(["  • Cột (*) là bắt buộc: mã DV, tên DV, loại"]);
    inst.addRow([
      "  • Loại phải nằm trong danh sách bên dưới (Nội bộ / Thuê ngoài)",
    ]);
    inst.addRow([
      "  • VD: DV001 | Vận chuyển nội thành | Thuê ngoài | 10 | Ghi chú",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 2 - ĐƠN GIÁ & ĐVT: Đơn vị tính và bảng giá"]);
    inst.addRow([
      "  • Mỗi dòng là 1 đơn vị tính, gắn với mã dịch vụ ở cột đầu",
    ]);
    inst.addRow([
      "  • unitName: tên đơn vị tính — nếu chưa có, hệ thống sẽ tự tạo mới",
    ]);
    inst.addRow([
      "  • costPrice (Giá đầu vào): giá vốn / chi phí thực hiện dịch vụ",
    ]);
    inst.addRow(["  • unitPrice (Giá đầu ra): giá bán cho khách hàng"]);
    inst.addRow(["  • VD: DV001 | Lần | 300000 | 500000"]);
    inst.addRow(["  • VD: DV001 | Km | 5000 | 10000"]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow([
      "  • Khi import UPDATE: hệ thống xoá hết đơn vị tính cũ rồi tạo mới từ sheet 2",
    ]);
    inst.addRow([
      "  • Khi import SKIP: nếu mã DV đã tồn tại, dòng đó sẽ bị bỏ qua",
    ]);
    inst.addRow([""]);
    inst.addRow(["Loại dịch vụ:", ...Object.values(serviceTypeMap)]);
    logger.info("[Service Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
    _extraUnitColumns?: ExportColumnConfig[],
  ): Promise<ExcelJS.Workbook> {
    const result = await this.serviceService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true } as any,
      undefined,
      req,
    );
    const services = result.data || [];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SERVICE_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : SERVICE_COLUMNS;
    sheet.columns = cols.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    for (const s of services) {
      sheet.addRow({
        code: s.code,
        name: s.name,
        type: serviceTypeMap[s.type as string] || s.type,
        taxRate: s.taxRate,
        note: s.note || "",
      });
    }

    // Export units
    const allUnits: {
      serviceCode: string;
      unitName: string;
      costPrice: number;
      unitPrice: number;
    }[] = [];
    for (const s of services) {
      if ((s as any).units?.length) {
        for (const u of (s as any).units) {
          allUnits.push({
            serviceCode: s.code,
            unitName: u.unit?.name || "",
            costPrice: u.costPrice ?? 0,
            unitPrice: u.unitPrice ?? 0,
          });
        }
      }
    }
    this.addUnitsSheet(workbook, allUnits);

    return workbook;
  }

  private addUnitsSheet(
    workbook: ExcelJS.Workbook,
    data: {
      serviceCode: string;
      unitName: string;
      costPrice: number;
      unitPrice: number;
    }[],
  ): void {
    const sheet = workbook.addWorksheet(SERVICE_SHEET_NAMES.UNITS);
    sheet.columns = SERVICE_UNIT_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    for (const row of data) {
      sheet.addRow(row);
    }
    applyColumnFormats(sheet, SERVICE_UNIT_COLUMNS);
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
