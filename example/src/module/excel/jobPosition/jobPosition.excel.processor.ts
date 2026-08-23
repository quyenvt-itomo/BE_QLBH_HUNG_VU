import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import {
  JOB_POSITION_SHEET_NAMES,
  RawJobPositionRow,
} from "./jobPosition.excel.types";
import { JOB_POSITION_TYPES } from "../../jobPosition/jobPosition.types";
import { JobPositionService } from "../../jobPosition/jobPosition.service";
import { ATTRIBUTE_TYPES } from "../../attribute/attribute.types";
import { AttributeService } from "../../attribute/attribute.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { AttributeType } from "@/database/models/Attribute";
import { JobPosition } from "@/database/models/company/JobPosition";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";

@injectable()
export class JobPositionExcelProcessor {
  constructor(
    @inject(JOB_POSITION_TYPES.JobPositionService)
    private jobPositionService: JobPositionService,
    @inject(ATTRIBUTE_TYPES.AttributeService)
    private attributeService: AttributeService,
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
      const sheet = workbook.getWorksheet(JOB_POSITION_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${JOB_POSITION_SHEET_NAMES.MAIN}'`,
        );
      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      const storeId = req.storeContext?.storeId;
      if (!storeId) throw new BadRequestError("Thiếu thông tin công ty");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.name) throw new Error("Thiếu tên vị trí");
          let jobTitleId: string | null = null;
          let jobTitleSnapshot: { id: string; name: string } | null = null;
          if (row.jobTitleName) {
            jobTitleSnapshot = await this.attributeService.findOrCreate(
              row.jobTitleName,
              AttributeType.JOB_TITLE,
              req,
            );
            jobTitleId = jobTitleSnapshot.id;
          }
          const data: Partial<
            Pick<
              JobPosition,
              | "name"
              | "level"
              | "jobTitleId"
              | "jobTitleSnapshot"
              | "note"
              | "storeId"
            >
          > = {
            name: row.name,
            level: row.level || null,
            jobTitleId,
            jobTitleSnapshot,
            note: row.note || null,
          };
          await withTransaction(async (manager) => {
            const existing = await this.jobPositionService.findOne({
              where: { name: row.name, storeId },
            });
            if (existing && options.duplicateHandling === "update") {
              await this.jobPositionService.update(
                existing.id,
                data,
                manager,
                req,
              );
            } else if (existing && options.duplicateHandling === "skip") {
              result.skippedRows++;
              return;
            } else if (existing && options.duplicateHandling === "stop") {
              throw new Error(`Vị trí ${row.name} đã tồn tại`);
            } else {
              data.storeId = storeId;
              await this.jobPositionService.create(data, manager, req);
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
      logger.error("[JobPosition Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }
    return result;
  }

  private parseSheet(sheet: ExcelJS.Worksheet): RawJobPositionRow[] {
    const rows: RawJobPositionRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const name = String(row.getCell(1).value || "").trim();
      if (!name) return;
      rows.push({
        name,
        level: String(row.getCell(2).value || "").trim(),
        jobTitleName: String(row.getCell(3).value || "").trim(),
        note: String(row.getCell(4).value || "").trim(),
      });
    });
    return rows;
  }
}
