import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import { USER_SHEET_NAMES, RawUserRow } from "./user.excel.types";
import { USER_TYPES } from "../../user/user.types";
import { UserService } from "../../user/user.service";
import { ORGANIZATION_TYPES } from "../../organization/organization.types";
import { OrganizationService } from "../../organization/organization.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { User } from "@/database/models/User";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";

type UserImportData = Partial<
  Pick<
    User,
    | "code"
    | "name"
    | "username"
    | "email"
    | "phone"
    | "isActive"
    | "note"
    | "sourceCompanyId"
  >
>;

@injectable()
export class UserExcelProcessor {
  constructor(
    @inject(USER_TYPES.UserService) private userService: UserService,
    @inject(ORGANIZATION_TYPES.OrganizationService)
    private organizationService: OrganizationService,
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
      const sheet = workbook.getWorksheet(USER_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${USER_SHEET_NAMES.MAIN}'`,
        );
      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.code || !row.name || !row.username)
            throw new Error("Thiếu mã, tên hoặc username");

          // Resolve sourceCompanyName → sourceCompanyId
          let sourceCompanyId: string | null = null;
          if (row.sourceCompanyName) {
            const org = await this.organizationService.findOne({
              where: { name: row.sourceCompanyName },
            });
            sourceCompanyId = org?.id || null;
          }

          const data: UserImportData = {
            code: row.code,
            name: row.name,
            username: row.username,
            email: row.email || null,
            phone: row.phone || null,
            isActive: row.isActive !== "Không",
            sourceCompanyId,
            note: row.note || null,
          };
          await withTransaction(async (manager) => {
            const existing = await this.userService.findOne({
              where: { username: row.username },
            });
            if (existing && options.duplicateHandling === "update") {
              await this.userService.update(existing.id, data, manager, req);
            } else if (existing && options.duplicateHandling === "skip") {
              result.skippedRows++;
              return;
            } else if (existing && options.duplicateHandling === "stop") {
              throw new Error(`Username ${row.username} đã tồn tại`);
            } else {
              await this.userService.create(data, manager, req);
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
      logger.error("[User Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }
    return result;
  }

  private parseSheet(sheet: ExcelJS.Worksheet): RawUserRow[] {
    const rows: RawUserRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const code = String(row.getCell(1).value || "").trim();
      if (!code) return;
      rows.push({
        code,
        name: String(row.getCell(2).value || "").trim(),
        username: String(row.getCell(3).value || "").trim(),
        email: String(row.getCell(4).value || "").trim(),
        phone: String(row.getCell(5).value || "").trim(),
        isActive: String(row.getCell(6).value || "").trim(),
        sourceCompanyName: String(row.getCell(7).value || "").trim(),
        note: String(row.getCell(8).value || "").trim(),
      });
    });
    return rows;
  }
}
