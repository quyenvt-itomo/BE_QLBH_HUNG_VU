import ExcelJS from "exceljs";
import { injectable, inject } from "inversify";
import logger from "@/shared/utils/logger";
import { Request } from "express";
import { ExportColumnConfig } from "../excel.types";
import {
  INCOME_EXPENSE_TYPES,
  IncomeExpenseService,
} from "@/modules/incomeExpense";
import { IncomeExpenseTypeEnum } from "@/shared/constants/enum";
import { TimezoneUtils } from "@/shared/utils/timezone.utils";

enum IncomeExpenseKey {
  OCCURRED_AT = "occurredAt",
  CODE = "code",
  DESCRIPTION = "description",
  AMOUNT = "amount",
  type = "type",
  FUND_NAME = "fundName",
  CATEGORY_NAME = "categoryName",
  PARTNER_NAME = "partnerName",
  CREATOR_NAME = "creatorName",
  STORE_NAME = "storeName",
}

const INCOME_EXPENSE_COLUMNS: ExportColumnConfig[] = [
  {
    field: IncomeExpenseKey.OCCURRED_AT,
    header: "Ngày",
    width: 20,
    type: "date",
  },
  {
    field: IncomeExpenseKey.CODE,
    header: "Số phiếu",
    width: 18,
    type: "string",
  },
  {
    field: IncomeExpenseKey.type,
    header: "Loại",
    width: 15,
    type: "string",
  },
  {
    field: IncomeExpenseKey.DESCRIPTION,
    header: "Diễn giải",
    width: 40,
    type: "string",
  },
  {
    field: IncomeExpenseKey.AMOUNT,
    header: "Số tiền",
    width: 18,
    type: "number",
  },
  {
    field: IncomeExpenseKey.FUND_NAME,
    header: "Quỹ",
    width: 20,
    type: "string",
  },
  {
    field: IncomeExpenseKey.CATEGORY_NAME,
    header: "Hạng mục",
    width: 25,
    type: "string",
  },
  {
    field: IncomeExpenseKey.PARTNER_NAME,
    header: "Đối tác",
    width: 30,
    type: "string",
  },
  {
    field: IncomeExpenseKey.CREATOR_NAME,
    header: "Người xử lý",
    width: 25,
    type: "string",
  },
  {
    field: IncomeExpenseKey.STORE_NAME,
    header: "Cửa hàng",
    width: 25,
    type: "string",
  },
];

@injectable()
export class IncomeExpenseExcelTemplate {
  constructor(
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseService)
    private incomeExpenseService: IncomeExpenseService,
  ) {}

  /**
   * Export dữ liệu Thu chi sang Excel
   */
  async exportData(
    req: Request,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("IncomeExpense");

    // Setup columns
    const columnDefs =
      columns.length > 0
        ? columns.map((col) => ({
            header: col.header,
            key: col.field,
            width: col.width || 15,
          }))
        : INCOME_EXPENSE_COLUMNS.map((col) => ({
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

    // Query income/expense records
    const { data: records } =
      await this.incomeExpenseService.findAllWithPagination({
        where: filters,
        ...filters,
        page: 1,
        size: 100000,
      });

    // Convert records to rows
    for (const record of records) {
      worksheet.addRow({
        [IncomeExpenseKey.OCCURRED_AT]: TimezoneUtils.utcToLocal(
          record.occurredAt,
          "Asia/Ho_Chi_Minh",
        ),
        [IncomeExpenseKey.CODE]: record.code,
        [IncomeExpenseKey.type]:
          record.type === IncomeExpenseTypeEnum.INCOME ? "Thu" : "Chi",
        [IncomeExpenseKey.DESCRIPTION]: record.description || "",
        [IncomeExpenseKey.AMOUNT]: record.amount || 0,
        [IncomeExpenseKey.FUND_NAME]: record.fund?.name || "",
        [IncomeExpenseKey.CATEGORY_NAME]: record.category?.name || "",
        [IncomeExpenseKey.PARTNER_NAME]: record.partner?.name || "",
        [IncomeExpenseKey.CREATOR_NAME]: record.creator?.name || "",
        [IncomeExpenseKey.STORE_NAME]: record.store?.name || "",
      });
    }

    // Format number column
    const amountColIndex = INCOME_EXPENSE_COLUMNS.findIndex(
      (col) => col.field === IncomeExpenseKey.AMOUNT,
    );
    if (amountColIndex !== -1) {
      worksheet.getColumn(amountColIndex + 1).numFmt = "#,##0";
    }

    // Format date column
    const dateColIndex = INCOME_EXPENSE_COLUMNS.findIndex(
      (col) => col.field === IncomeExpenseKey.OCCURRED_AT,
    );
    if (dateColIndex !== -1) {
      worksheet.getColumn(dateColIndex + 1).numFmt = "dd/mm/yyyy hh:mm";
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

    logger.info(`[IncomeExpense Template] Exported ${records.length} records`);
    return workbook;
  }
}
