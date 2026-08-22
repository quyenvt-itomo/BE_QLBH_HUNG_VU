import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import {
  SERVICE_SHEET_NAMES,
  serviceTypeMap,
  RawServiceRow,
  RawServiceUnitRow,
} from "./service.excel.types";
import { SERVICE_TYPES } from "../../service/service.types";
import { ServiceService } from "../../service/service.service";
import { ATTRIBUTE_TYPES } from "../../attribute/attribute.types";
import { AttributeService } from "../../attribute/attribute.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { Service, ServiceTypeEnum } from "@/database/models/company/Service";
import { ServiceUnit } from "@/database/models/company/ServiceUnit";
import { AttributeType } from "@/database/models/Attribute";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";

const reverseTypeMap: Record<string, ServiceTypeEnum> = {};
for (const [k, v] of Object.entries(serviceTypeMap))
  reverseTypeMap[v] = k as ServiceTypeEnum;

@injectable()
export class ServiceExcelProcessor {
  constructor(
    @inject(SERVICE_TYPES.ServiceService)
    private serviceService: ServiceService,
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
      const sheet = workbook.getWorksheet(SERVICE_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${SERVICE_SHEET_NAMES.MAIN}'`,
        );
      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      // Parse units sheet
      const unitsMap = this.parseUnits(workbook);

      const companyId = req.companyContext?.companyId;
      if (!companyId) throw new BadRequestError("Thiếu thông tin công ty");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.code || !row.name || !row.type)
            throw new Error("Thiếu mã, tên hoặc loại");
          const type =
            reverseTypeMap[row.type] || (row.type as ServiceTypeEnum);
          const data: Partial<
            Pick<
              Service,
              "code" | "name" | "type" | "taxRate" | "note" | "companyId"
            >
          > = {
            code: row.code,
            name: row.name,
            type,
            taxRate: row.taxRate ?? 0,
            note: row.note || null,
          };
          let savedService: Service | null = null;
          await withTransaction(async (manager) => {
            const existing = await this.serviceService.findOne({
              where: { code: row.code, companyId },
            });
            if (existing && options.duplicateHandling === "update") {
              savedService = await this.serviceService.update(
                existing.id,
                data,
                manager,
                req,
              );
            } else if (existing && options.duplicateHandling === "skip") {
              result.skippedRows++;
              return;
            } else if (existing && options.duplicateHandling === "stop") {
              throw new Error(`Mã ${row.code} đã tồn tại`);
            } else {
              data.companyId = companyId;
              savedService = await this.serviceService.create(
                data,
                manager,
                req,
              );
            }

            // Process units
            const units = unitsMap.get(row.code);
            if (units && units.length > 0 && savedService) {
              const unitRepo = manager.getRepository(ServiceUnit);

              // Xoá units cũ nếu update
              if (existing && options.duplicateHandling === "update") {
                await unitRepo.delete({ serviceId: savedService.id });
              }

              for (const u of units) {
                const unitId = (
                  await this.attributeService.findOrCreate(
                    u.unitName,
                    AttributeType.UNIT,
                    req,
                  )
                ).id;
                await unitRepo.save(
                  unitRepo.create({
                    serviceId: savedService.id,
                    unitId,
                    costPrice: u.costPrice ?? 0,
                    unitPrice: u.unitPrice ?? 0,
                  }),
                );
              }
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
      logger.error("[Service Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }
    return result;
  }

  private parseSheet(sheet: ExcelJS.Worksheet): RawServiceRow[] {
    const rows: RawServiceRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const code = String(row.getCell(1).value || "").trim();
      if (!code) return;
      rows.push({
        code,
        name: String(row.getCell(2).value || "").trim(),
        type: String(row.getCell(3).value || "").trim(),
        taxRate: Number(row.getCell(4).value) || 0,
        note: String(row.getCell(5).value || "").trim(),
      });
    });
    return rows;
  }

  private parseUnits(
    workbook: ExcelJS.Workbook,
  ): Map<string, RawServiceUnitRow[]> {
    const map = new Map<string, RawServiceUnitRow[]>();
    const sheet = workbook.getWorksheet(SERVICE_SHEET_NAMES.UNITS);
    if (!sheet) return map;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const serviceCode = String(row.getCell(1).value || "").trim();
      if (!serviceCode) return;
      const unit: RawServiceUnitRow = {
        serviceCode,
        unitName: String(row.getCell(2).value || "").trim(),
        costPrice: Number(row.getCell(3).value) || undefined,
        unitPrice: Number(row.getCell(4).value) || undefined,
      };
      if (!map.has(serviceCode)) map.set(serviceCode, []);
      map.get(serviceCode)!.push(unit);
    });
    return map;
  }
}
