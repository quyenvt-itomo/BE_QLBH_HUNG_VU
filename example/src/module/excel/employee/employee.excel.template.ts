import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { applyColumnFormats } from "../excel.dropdown";
import {
  EMPLOYEE_COLUMNS,
  EMPLOYEE_GROUPS,
  EMPLOYEE_SHEET_NAMES,
  ALLOWANCE_COLUMNS,
  DEDUCTION_COLUMNS,
  CONTRACT_COLUMNS,
  employeeStatusMap,
  genderMap,
  identityTypeMap,
  contractTypeMap,
} from "./employee.excel.types";
import { EMPLOYEE_TYPES } from "../../employee/employee.types";
import { EmployeeService } from "../../employee/employee.service";
import { RequestContext } from "@/shared/types/interfaces";
import {
  formatDateDMY,
  formatAddressForExcel,
} from "@/shared/utils/address.util";
import logger from "@/shared/utils/logger";

@injectable()
export class EmployeeExcelTemplate {
  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeService)
    private employeeService: EmployeeService,
  ) {}

  async generateTemplate(_branchId?: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(EMPLOYEE_SHEET_NAMES.MAIN);
    const flatColumns = EMPLOYEE_COLUMNS;

    // Set column widths and keys (no headers via sheet.columns)
    flatColumns.forEach((c, i) => {
      const col = sheet.getColumn(i + 1);
      if (col) {
        col.width = c.width || 15;
        col.key = c.field; // needed for sheet.addRow({key: value})
      }
    });

    // Row 1: Group headers (orange)
    const gRow = sheet.getRow(1);
    gRow.height = 28;
    let colIdx = 1;
    for (const group of EMPLOYEE_GROUPS) {
      const startCol = colIdx;
      const endCol = colIdx + group.columns.length - 1;
      if (group.columns.length > 1) {
        sheet.mergeCells(1, startCol, 1, endCol);
      }
      const cell = gRow.getCell(startCol);
      cell.value = group.name;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFED7D31" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      this.setBorder(cell);
      colIdx = endCol + 1;
    }

    // Row 2: Column headers (blue)
    const hRow = sheet.getRow(2);
    hRow.height = 24;
    flatColumns.forEach((c, i) => {
      const cell = hRow.getCell(i + 1);
      cell.value = c.header;
    });
    this.formatHeader(hRow);

    // Row 3: Sample data
    sheet.addRow({
      code: "NV001",
      name: "Nguyễn Văn A",
      gender: "Nam",
      dob: "15/01/1990",
      maritalStatus: "Độc thân",
      taxCode: "",
      ethnicity: "Kinh",
      religion: "",
      identityType: "CCCD",
      identityCode: "012345678901",
      issuedDate: "01/06/2021",
      issuedPlace: "Cục CSQLHC về TTXH",
      expiredDate: "01/06/2036",
      email: "a@example.com",
      phone: "0901234567",
      permanentAddress: "121 Ngô Thì Sỹ, Đại Mỗ, Hà Nội",
      currentAddress: "45 Nguyễn Huệ, Bến Thành, Hồ Chí Minh",
      emergencyName: "Nguyễn Văn B",
      emergencyPhone: "0909876543",
      emergencyRelationship: "Anh ruột",
      orgName: "Chi nhánh HCM",
      jobPositionName: "Nhân viên kinh doanh",
      baseSalary: 15000000,
      workingStatus: "",
      employeeStatus: "Đang làm việc",
      trialDate: "01/12/2019",
      officialDate: "01/03/2020",
      bankName: "Vietcombank",
      bankAccount: "0123456789",
      insuranceNumber: "0123456789",
      insuranceStartDate: "01/03/2020",
      insuranceRate: 32,
      note: "Nhân viên mẫu",
    });
    applyColumnFormats(sheet, EMPLOYEE_COLUMNS, 500, 3); // data starts at row 3

    // Sub-sheets
    this.addSubSheet(
      workbook,
      EMPLOYEE_SHEET_NAMES.ALLOWANCES,
      ALLOWANCE_COLUMNS,
      {
        employeeCode: "NV001",
        name: "Phụ cấp xăng xe",
        amount: 500000,
        note: "",
      },
    );
    this.addSubSheet(
      workbook,
      EMPLOYEE_SHEET_NAMES.DEDUCTIONS,
      DEDUCTION_COLUMNS,
      {
        employeeCode: "NV001",
        name: "Khấu trừ BHXH",
        amount: 1200000,
        note: "",
      },
    );
    this.addSubSheet(
      workbook,
      EMPLOYEE_SHEET_NAMES.CONTRACTS,
      CONTRACT_COLUMNS,
      {
        employeeCode: "NV001",
        contractNumber: "HD001",
        type: "Chính thức",
        salary: 15000000,
        startDate: "01/03/2020",
        endDate: "",
      },
    );

    const inst = workbook.addWorksheet("Hướng dẫn");
    inst.addRow(["HƯỚNG DẪN NHẬP NHÂN SỰ"]);
    inst.addRow([""]);
    inst.addRow(["📌 CẤU TRÚC FILE:"]);
    inst.addRow([
      "File gồm 4 sheet. Dòng 1 là tiêu đề nhóm (màu cam), dòng 2 là tên cột (màu xanh).",
    ]);
    inst.addRow(["Nhập dữ liệu từ dòng 3 trở đi."]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 1 - NHÂN SỰ: Thông tin chính của nhân viên"]);
    inst.addRow(["  • Cột (*) là bắt buộc: mã NV, tên NV"]);
    inst.addRow([
      "  • Ngày tháng nhập theo định dạng dd/mm/yyyy (VD: 01/01/1990)",
    ]);
    inst.addRow(["  • Địa chỉ nhập theo format: Số nhà, Phường/Xã, Tỉnh/TP"]);
    inst.addRow([
      "  • orgName: tên tổ chức/phòng ban — hệ thống sẽ tự tìm và gán",
    ]);
    inst.addRow([
      "  • jobPositionName: tên vị trí công việc — hệ thống sẽ tự tìm và gán",
    ]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 2 - PHỤ CẤP: Các khoản phụ cấp theo nhân viên"]);
    inst.addRow([
      "  • Mỗi dòng là 1 khoản phụ cấp, gắn với mã nhân viên ở cột đầu",
    ]);
    inst.addRow(["  • VD: NV001 | Phụ cấp xăng | 500000 | Hỗ trợ đi lại"]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 3 - KHẤU TRỪ: Các khoản khấu trừ theo nhân viên"]);
    inst.addRow(["  • Tương tự sheet Phụ cấp, mỗi dòng là 1 khoản khấu trừ"]);
    inst.addRow(["  • VD: NV001 | BHXH | 1050000 | Bảo hiểm xã hội"]);
    inst.addRow([""]);
    inst.addRow(["📋 SHEET 4 - HỢP ĐỒNG: Hợp đồng lao động theo nhân viên"]);
    inst.addRow(["  • Cột Loại HĐ phải nằm trong danh sách bên dưới"]);
    inst.addRow([
      "  • VD: NV001 | HD001 | Chính thức | 15000000 | 01/01/2024 | 31/12/2024",
    ]);
    inst.addRow([""]);
    inst.addRow(["📌 CHÚ Ý:"]);
    inst.addRow(["  • Không sửa tên sheet, không thêm/xoá cột"]);
    inst.addRow([
      "  • Khi import UPDATE: hệ thống xoá hết phụ cấp/khấu trừ/hợp đồng cũ rồi tạo mới",
    ]);
    inst.addRow([
      "  • Khi import SKIP: bỏ qua dòng đã tồn tại (kiểm tra theo mã NV)",
    ]);
    inst.addRow([""]);
    inst.addRow(["Giới tính:", ...Object.values(genderMap)]);
    inst.addRow(["Trạng thái NV:", ...Object.values(employeeStatusMap)]);
    inst.addRow(["Loại HĐ:", ...Object.values(contractTypeMap)]);

    logger.info("[Employee Template] Generated");
    return workbook;
  }

  async exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const result = await this.employeeService.findAllWithPagination(
      { ...filters, size: 10000, useFullDetail: true },
      undefined,
      req,
    );
    const employees = result.data || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(EMPLOYEE_SHEET_NAMES.MAIN);
    const cols = columns.length ? columns : EMPLOYEE_COLUMNS;

    // Set column widths and keys
    cols.forEach((c, i) => {
      const col = sheet.getColumn(i + 1);
      if (col) {
        col.width = c.width || 15;
        col.key = c.field;
      }
    });

    // Row 1: Group headers (orange)
    const gRow = sheet.getRow(1);
    gRow.height = 28;
    let colIdx = 1;
    for (const group of EMPLOYEE_GROUPS) {
      const startCol = colIdx;
      const endCol = colIdx + group.columns.length - 1;
      if (group.columns.length > 1) {
        sheet.mergeCells(1, startCol, 1, endCol);
      }
      const cell = gRow.getCell(startCol);
      cell.value = group.name;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFED7D31" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      this.setBorder(cell);
      colIdx = endCol + 1;
    }

    // Row 2: Column headers (blue)
    const hRow = sheet.getRow(2);
    hRow.height = 24;
    cols.forEach((c, i) => {
      const cell = hRow.getCell(i + 1);
      cell.value = c.header;
    });
    this.formatHeader(hRow);

    // Map employee code → row number
    const rowMap = new Map<string, number>();
    let rowIdx = 3;

    for (const e of employees) {
      const statusLabel =
        employeeStatusMap[e.employeeStatus as string] || e.employeeStatus || "";
      sheet.addRow({
        code: e.code,
        name: e.name,
        gender: genderMap[e.gender as string] || e.gender || "",
        dob: formatDateDMY(e.dob),
        maritalStatus: e.maritalStatus || "",
        taxCode: e.taxCode || "",
        ethnicity: e.ethnicity || "",
        religion: e.religion || "",
        identityType: e.identification?.type
          ? identityTypeMap[e.identification.type] || e.identification.type
          : "",
        identityCode: e.identification?.identityCode || "",
        issuedDate: formatDateDMY(e.identification?.issuedDate),
        issuedPlace: e.identification?.issuedPlace || "",
        expiredDate: formatDateDMY(e.identification?.expiredDate),
        email: e.email || "",
        phone: e.phone || "",
        permanentAddress: formatAddressForExcel(e.permanentAddress),
        currentAddress: formatAddressForExcel(e.currentAddress),
        emergencyName: e.emergencyContact?.name || "",
        emergencyPhone: e.emergencyContact?.phone || "",
        emergencyRelationship: e.emergencyContact?.relativetionship || "",
        orgName: e.workingOrganization?.name || "",
        jobPositionName: e.jobPosition?.name || "",
        baseSalary: e.baseSalary ?? "",
        workingStatus: e.workingStatus || "",
        employeeStatus: statusLabel,
        trialDate: formatDateDMY(e.trialDate),
        officialDate: formatDateDMY(e.officialDate),
        bankName: e.bankAccount?.bankName || "",
        bankAccount: e.bankAccount?.accountNumber || "",
        insuranceNumber: e.insuranceInfo?.insuranceNumber || "",
        insuranceStartDate: formatDateDMY(e.insuranceInfo?.startDate),
        insuranceRate: e.insuranceInfo?.rate ?? "",
        note: e.note || "",
      });
      rowMap.set(e.code, rowIdx);
      rowIdx++;
    }

    // Sub-sheets with hyperlinks
    const allowanceSheet = workbook.addWorksheet(
      EMPLOYEE_SHEET_NAMES.ALLOWANCES,
    );
    allowanceSheet.columns = ALLOWANCE_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(allowanceSheet.getRow(1));
    for (const e of employees) {
      for (const a of e.allowances || []) {
        const row = allowanceSheet.addRow({
          employeeCode: e.code,
          name: a.name,
          amount: a.amount,
          note: a.note || "",
        });
        const mainRow = rowMap.get(e.code);
        if (mainRow)
          this.setHyperlink(
            row.getCell(1),
            e.code,
            EMPLOYEE_SHEET_NAMES.MAIN,
            `A${mainRow}`,
          );
      }
    }

    const deductionSheet = workbook.addWorksheet(
      EMPLOYEE_SHEET_NAMES.DEDUCTIONS,
    );
    deductionSheet.columns = DEDUCTION_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(deductionSheet.getRow(1));
    for (const e of employees) {
      for (const d of e.deductions || []) {
        const row = deductionSheet.addRow({
          employeeCode: e.code,
          name: d.name,
          amount: d.amount,
          note: d.note || "",
        });
        const mainRow = rowMap.get(e.code);
        if (mainRow)
          this.setHyperlink(
            row.getCell(1),
            e.code,
            EMPLOYEE_SHEET_NAMES.MAIN,
            `A${mainRow}`,
          );
      }
    }

    const contractSheet = workbook.addWorksheet(EMPLOYEE_SHEET_NAMES.CONTRACTS);
    contractSheet.columns = CONTRACT_COLUMNS.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(contractSheet.getRow(1));
    for (const e of employees) {
      for (const ct of e.contracts || []) {
        const row = contractSheet.addRow({
          employeeCode: e.code,
          contractNumber: ct.contractNumber,
          type: contractTypeMap[ct.type as string] || ct.type || "",
          salary: ct.salary,
          startDate: formatDateDMY(ct.startDate),
          endDate: formatDateDMY(ct.endDate),
        });
        const mainRow = rowMap.get(e.code);
        if (mainRow)
          this.setHyperlink(
            row.getCell(1),
            e.code,
            EMPLOYEE_SHEET_NAMES.MAIN,
            `A${mainRow}`,
          );
      }
    }

    return workbook;
  }

  private addSubSheet(
    workbook: ExcelJS.Workbook,
    name: string,
    columns: ExportColumnConfig[],
    sampleRow: Record<string, any>,
  ): void {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.field,
      width: c.width || 15,
    }));
    this.formatHeader(sheet.getRow(1));
    sheet.addRow(sampleRow);
    applyColumnFormats(sheet, columns);
  }

  private formatHeader(row: ExcelJS.Row): void {
    row.height = 24;
    row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    row.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    row.eachCell((cell) => this.setBorder(cell));
  }

  private setBorder(cell: ExcelJS.Cell): void {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }

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
    cell.font = { color: { argb: "FF0563C1" }, underline: true };
  }
}
