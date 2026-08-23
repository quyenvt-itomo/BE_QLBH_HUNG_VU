import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import {
  WAREHOUSE_SHEET_NAMES,
  RawWarehouseRow,
} from "./warehouse.excel.types";
import { WAREHOUSE_TYPES } from "../../warehouse/warehouse.types";
import { WarehouseService } from "../../warehouse/warehouse.service";
import { EMPLOYEE_TYPES } from "../../employee/employee.types";
import { EmployeeService } from "../../employee/employee.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { Warehouse } from "@/database/models/company/Warehouse";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";
import { parseAddressFromExcel } from "@/shared/utils/address.util";

type WarehouseImportData = Partial<
  Pick<
    Warehouse,
    "code" | "name" | "phone" | "address" | "note" | "managerId" | "storeId"
  >
>;

@injectable()
export class WarehouseExcelProcessor {
  constructor(
    @inject(WAREHOUSE_TYPES.WarehouseService)
    private warehouseService: WarehouseService,
    @inject(EMPLOYEE_TYPES.EmployeeService)
    private employeeService: EmployeeService,
  ) {}

  async processImport(
    req: RequestContext,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      skippedRows: 0,
      errors: [],
      data: [],
    };
    try {
      const sheet = workbook.getWorksheet(WAREHOUSE_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${WAREHOUSE_SHEET_NAMES.MAIN}'`,
        );
      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      const storeId = req.storeContext?.storeId;
      if (!storeId) throw new BadRequestError("Thiếu thông tin công ty");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.code || !row.name) throw new Error("Thiếu mã hoặc tên kho");

          // Resolve managerCode → managerId (Employee lookup by code)
          let managerId: string | null = null;
          if (row.managerCode) {
            const manager = await this.employeeService.findOne({
              where: { code: row.managerCode, storeId },
            });
            managerId = manager?.id || null;
          }

          const data: WarehouseImportData = {
            code: row.code,
            name: row.name,
            phone: row.phone || null,
            address: parseAddressFromExcel(row.address),
            managerId,
            note: row.note || null,
          };
          await withTransaction(async (manager) => {
            const existing = await this.warehouseService.findOne({
              where: { code: row.code, storeId },
            });
            if (existing && options.duplicateHandling === "update") {
              await this.warehouseService.update(
                existing.id,
                data,
                manager,
                req,
              );
            } else if (existing && options.duplicateHandling === "skip") {
              result.skippedRows++;
              return;
            } else if (existing && options.duplicateHandling === "stop") {
              throw new Error(`Mã kho ${row.code} đã tồn tại`);
            } else {
              data.storeId = storeId;
              await this.warehouseService.create(data, manager, req);
            }
          });
          result.successRows++;
        } catch (err: unknown) {
          result.errorRows++;
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push({
            row: i + 2,
            message,
            data: row,
          });
          if (options.errorHandling === "stop_on_error") break;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("[Warehouse Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }
    return result;
  }

  private parseSheet(sheet: ExcelJS.Worksheet): RawWarehouseRow[] {
    const rows: RawWarehouseRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const code = String(row.getCell(1).value || "").trim();
      if (!code) return;
      rows.push({
        code,
        name: String(row.getCell(2).value || "").trim(),
        phone: String(row.getCell(3).value || "").trim(),
        address: String(row.getCell(4).value || "").trim(),
        managerCode: String(row.getCell(5).value || "").trim(),
        note: String(row.getCell(6).value || "").trim(),
      });
    });
    return rows;
  }
}
