import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ExportColumnConfig } from "../excel.types";
import { PARTNER_TYPES, PartnerService } from "@/modules/partner";
import { Request } from "express";
import { CUSTOMER_COLUMNS, CustomerKey } from "./customer.types";
import { PartnerTypeEnum } from "@/shared/constants/enum";
import {
  generateAddressOptions,
  ProvinceData,
} from "../../../shared/utils/address.helper";
import vietnamProvinces from "../../../shared/constants/vietnam-provinces.json";

/**
 * Customer Excel Template Generator
 * Tạo template và export data cho Customer (Partner với type = CUSTOMER)
 */
@injectable()
export class CustomerExcelTemplate {
  private readonly addressOptions: string[];

  constructor(
    @inject(PARTNER_TYPES.PartnerService)
    private partnerService: PartnerService,
  ) {
    // Generate address options khi khởi tạo
    this.addressOptions = generateAddressOptions(
      vietnamProvinces as ProvinceData[],
    );
  }

  /**
   * Tạo template Excel rỗng cho import Customer
   */
  async generateTemplate(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    // Định nghĩa các cột
    worksheet.columns = CUSTOMER_COLUMNS.map((col) => ({
      header: col.header,
      key: col.field,
      width: col.width || 15,
    }));

    // Format header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Thêm data validation cho một số cột
    this.addDataValidations(workbook, worksheet);

    // Thêm hướng dẫn
    this.addInstructions(workbook);

    return workbook;
  }

  /**
   * Export dữ liệu Customer sang Excel
   */
  async exportData(
    req: Request,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customers");

    // Setup columns
    const columnDefs =
      columns.length > 0
        ? columns.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }))
        : CUSTOMER_COLUMNS.map((col) => ({
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
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 25;

    // Lấy dữ liệu customers với role CUSTOMER
    const customersResponse = await this.partnerService.getByRole(
      PartnerTypeEnum.CUSTOMER,
      {
        ...filters,
        page: 1,
        size: 100000, // Giới hạn 100k bản ghi
        offsetAt: new Date(),
      },
    );

    const customers = customersResponse.data || [];

    // Convert customers to rows
    for (const customer of customers) {
      const addressParts = customer.addresses || [];
      const mainAddress = addressParts[0];

      worksheet.addRow({
        [CustomerKey.TYPE]: customer.isOrganization ? "Tổ chức" : "Cá nhân",
        [CustomerKey.CODE]: customer.code,
        [CustomerKey.NAME]: customer.name,
        [CustomerKey.PHONE]: customer.phone || "",
        [CustomerKey.EMAIL]: customer.email || "",
        [CustomerKey.ADDRESS]: mainAddress
          ? `${mainAddress.state || ""} - ${mainAddress.ward || ""}`
          : "",
        [CustomerKey.DETAIL_ADDRESS]: mainAddress?.detail || "",
        [CustomerKey.TAX_CODE]: customer.taxCode || "",
        [CustomerKey.GROUP]: customer.group?.name || "",
        [CustomerKey.NOTE]: "",
        [CustomerKey.CURRENT_REVENUE]: customer.totalRevenue || 0,
        [CustomerKey.CURRENT_LOYALTY_POINTS]: customer.loyaltyPoints || 0,
        [CustomerKey.RECEIVABLE_AMOUNT]:
          (customer as any).receivableDebtAmount || 0,
      });
    }

    // Format number columns
    worksheet.getColumn(CustomerKey.CURRENT_REVENUE).numFmt = "#,##0";
    worksheet.getColumn(CustomerKey.CURRENT_LOYALTY_POINTS).numFmt = "#,##0";
    worksheet.getColumn(CustomerKey.RECEIVABLE_AMOUNT).numFmt = "#,##0";

    // Auto-filter
    if (worksheet.columns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length },
      };
    }

    // Freeze first row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    return workbook;
  }

  /**
   * Thêm data validations
   */
  private addDataValidations(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
  ) {
    // Tạo hidden sheet chứa address options
    const addressSheet = workbook.addWorksheet("_AddressOptions");
    addressSheet.state = "hidden";

    // Thêm tất cả address options vào hidden sheet
    this.addressOptions.forEach((address, index) => {
      addressSheet.getCell(index + 1, 1).value = address;
    });

    // Validation cho cột TYPE (Cá nhân/Tổ chức)
    const typeColIndex = this.getColumnIndex(CustomerKey.TYPE);
    if (typeColIndex > 0) {
      for (let row = 2; row <= 1000; row++) {
        worksheet.getCell(row, typeColIndex).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Cá nhân,Tổ chức"'],
          showErrorMessage: true,
          errorTitle: "Giá trị không hợp lệ",
          error: 'Chỉ được chọn "Cá nhân" hoặc "Tổ chức"',
        };
      }
    }

    // Validation cho cột ADDRESS (reference to hidden sheet)
    const addressColIndex = this.getColumnIndex(CustomerKey.ADDRESS);
    if (addressColIndex > 0 && this.addressOptions.length > 0) {
      const lastRow = this.addressOptions.length;
      for (let row = 2; row <= 1000; row++) {
        worksheet.getCell(row, addressColIndex).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`_AddressOptions!$A$1:$A$${lastRow}`],
          showErrorMessage: true,
          errorTitle: "Địa chỉ không hợp lệ",
          error: "Vui lòng chọn địa chỉ từ danh sách",
        };
      }
    }

    // Validation cho email
    const emailColIndex = this.getColumnIndex(CustomerKey.EMAIL);
    if (emailColIndex > 0) {
      for (let row = 2; row <= 1000; row++) {
        worksheet.getCell(row, emailColIndex).dataValidation = {
          type: "textLength",
          allowBlank: true,
          operator: "lessThanOrEqual",
          formulae: [255],
          showErrorMessage: true,
          errorTitle: "Email quá dài",
          error: "Email không được vượt quá 255 ký tự",
        };
      }
    }

    // Validation cho số tiền (phải >= 0)
    [
      CustomerKey.CURRENT_REVENUE,
      CustomerKey.CURRENT_LOYALTY_POINTS,
      CustomerKey.RECEIVABLE_AMOUNT,
    ].forEach((key) => {
      const colIndex = this.getColumnIndex(key);
      if (colIndex > 0) {
        for (let row = 2; row <= 1000; row++) {
          worksheet.getCell(row, colIndex).dataValidation = {
            type: "decimal",
            operator: "greaterThanOrEqual",
            allowBlank: true,
            formulae: [0],
            showErrorMessage: true,
            errorTitle: "Giá trị không hợp lệ",
            error: "Giá trị phải >= 0",
          };
        }
      }
    });
  }

  /**
   * Get column index by field key
   */
  private getColumnIndex(key: CustomerKey): number {
    const idx = CUSTOMER_COLUMNS.findIndex((col) => col.field === key);
    return idx >= 0 ? idx + 1 : -1;
  }

  /**
   * Thêm hướng dẫn sử dụng
   */
  private addInstructions(workbook: ExcelJS.Workbook) {
    const instructionSheet = workbook.addWorksheet("Hướng dẫn");

    instructionSheet.columns = [
      { header: "Cột", key: "column", width: 25 },
      { header: "Mô tả", key: "description", width: 60 },
      { header: "Bắt buộc", key: "required", width: 12 },
    ];

    // Format header
    const headerRow = instructionSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add instructions for each column
    instructionSheet.addRow({
      column: "Loại khách hàng",
      description: 'Chọn "Cá nhân" hoặc "Tổ chức". Mặc định là "Cá nhân"',
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Mã khách hàng",
      description: "Mã định danh duy nhất. Hệ thống tự tạo nếu để trống",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Tên khách hàng",
      description: "Tên đầy đủ của khách hàng hoặc công ty",
      required: "Có",
    });

    instructionSheet.addRow({
      column: "Số điện thoại",
      description: "Số điện thoại liên hệ (tối đa 50 ký tự)",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Email",
      description: "Địa chỉ email (phải đúng định dạng)",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Địa chỉ",
      description: "Tỉnh/Thành phố - Phường/Xã",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Địa chỉ chi tiết",
      description: "Số nhà, tên đường, etc.",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Mã số thuế",
      description: "Mã số thuế doanh nghiệp (nếu là tổ chức)",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Nhóm khách hàng",
      description: "Tên nhóm khách hàng (nếu có)",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Ghi chú",
      description: "Thông tin bổ sung",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Doanh số hiện tại",
      description: "Tổng doanh số tích lũy (số tiền >= 0)",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Điểm tích lũy",
      description: "Số điểm khách hàng hiện có (>= 0)",
      required: "Không",
    });

    instructionSheet.addRow({
      column: "Số tiền đang nợ",
      description: "Công nợ hiện tại của khách hàng",
      required: "Không",
    });

    // Add general notes
    instructionSheet.addRow({});
    instructionSheet.addRow({
      column: "CHÚ Ý:",
      description: "",
      required: "",
    });
    instructionSheet.addRow({
      column: "",
      description: "- Các cột có dấu (*) là bắt buộc phải nhập",
      required: "",
    });
    instructionSheet.addRow({
      column: "",
      description: "- Mã khách hàng phải là duy nhất trong hệ thống",
      required: "",
    });
    instructionSheet.addRow({
      column: "",
      description: "- Email và số điện thoại nên là duy nhất",
      required: "",
    });
    instructionSheet.addRow({
      column: "",
      description: "- Các giá trị số tiền và điểm phải >= 0",
      required: "",
    });
    instructionSheet.addRow({
      column: "",
      description:
        "- Số tiền đang nợ chỉ được ghi nhận nếu Import file từ một cửa hàng, và sẽ được liên kết với cửa hàng đó",
      required: "",
    });
  }
}
