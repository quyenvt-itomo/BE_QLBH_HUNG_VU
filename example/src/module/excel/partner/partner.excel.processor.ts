import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import {
  PARTNER_SHEET_NAMES,
  partnerTypeMap,
  RawPartnerRow,
} from "./partner.excel.types";
import { PARTNER_TYPES } from "../../partner/partner.types";
import { PartnerService } from "../../partner/partner.service";
import { ATTRIBUTE_TYPES } from "../../attribute/attribute.types";
import { AttributeService } from "../../attribute/attribute.service";
import { EMPLOYEE_TYPES } from "../../employee/employee.types";
import { EmployeeService } from "../../employee/employee.service";
import { PAYMENT_TERM_TYPES } from "../../paymentTerm/paymentTerm.types";
import { PaymentTermService } from "../../paymentTerm/paymentTerm.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import { PartnerType, Partner } from "@/database/models/company/Partner";
import { AttributeType } from "@/database/models/Attribute";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";
import { parseAddressFromExcel } from "@/shared/utils/address.util";

const reverseTypeMap: Record<string, PartnerType> = {};
for (const [k, v] of Object.entries(partnerTypeMap)) {
  reverseTypeMap[v] = k as PartnerType;
}

type PartnerImportData = Partial<
  Pick<
    Partner,
    | "code"
    | "name"
    | "types"
    | "groupId"
    | "taxCode"
    | "phone"
    | "email"
    | "address"
    | "representative"
    | "banks"
    | "note"
    | "staffId"
    | "paymentTermId"
    | "storeId"
  >
>;

@injectable()
export class PartnerExcelProcessor {
  constructor(
    @inject(PARTNER_TYPES.PartnerService)
    private partnerService: PartnerService,
    @inject(ATTRIBUTE_TYPES.AttributeService)
    private attributeService: AttributeService,
    @inject(EMPLOYEE_TYPES.EmployeeService)
    private employeeService: EmployeeService,
    @inject(PAYMENT_TERM_TYPES.PaymentTermService)
    private paymentTermService: PaymentTermService,
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
      const sheet = workbook.getWorksheet(PARTNER_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${PARTNER_SHEET_NAMES.MAIN}'`,
        );

      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      const storeId = req.storeContext?.storeId;
      if (!storeId) throw new BadRequestError("Thiếu thông tin công ty");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.code || !row.name || !row.types) {
            throw new Error("Thiếu mã, tên hoặc loại đối tác");
          }

          const typeNames = row.types.split(/[,;]/).map((s) => s.trim());
          const types: PartnerType[] = [];
          for (const tn of typeNames) {
            const mapped = reverseTypeMap[tn] || (tn as PartnerType);
            types.push(mapped);
          }

          // Resolve groupName → groupId via findOrCreate (auto-create if missing)
          let groupId: string | null = null;
          if (row.groupName) {
            groupId = (
              await this.attributeService.findOrCreate(
                row.groupName,
                AttributeType.PARTNER_GROUP,
                req,
              )
            ).id;
          }

          // Resolve staffCode → staffId (Employee lookup by code)
          let staffId: string | null = null;
          if (row.staffCode) {
            const staff = await this.employeeService.findOne({
              where: { code: row.staffCode, storeId },
            });
            staffId = staff?.id || null;
          }

          // Resolve paymentTermName → paymentTermId (PaymentTerm lookup by name)
          let paymentTermId: string | null = null;
          if (row.paymentTermName) {
            const pt = await this.paymentTermService.findOne({
              where: { name: row.paymentTermName, storeId },
            });
            paymentTermId = pt?.id || null;
          }

          const data: PartnerImportData = {
            code: row.code,
            name: row.name,
            types,
            groupId,
            staffId,
            paymentTermId,
            taxCode: row.taxCode || null,
            phone: row.phone || null,
            email: row.email || null,
            address: parseAddressFromExcel(row.address),
            representative: row.representativeName
              ? {
                  name: row.representativeName,
                  phone: row.representativePhone || null,
                }
              : null,
            banks: row.bankName
              ? [
                  {
                    bankName: row.bankName,
                    accountNumber: row.bankAccount || "",
                    accountHolder: "",
                    branch: "",
                  },
                ]
              : [],
            note: row.note || null,
          };

          await withTransaction(async (manager) => {
            const existing = await this.partnerService.findOne({
              where: { code: row.code, storeId },
            });
            if (existing && options.duplicateHandling === "update") {
              await this.partnerService.update(existing.id, data, manager, req);
            } else if (existing && options.duplicateHandling === "skip") {
              result.skippedRows++;
              return;
            } else if (existing && options.duplicateHandling === "stop") {
              throw new Error(`Mã ${row.code} đã tồn tại`);
            } else {
              data.storeId = storeId;
              await this.partnerService.create(data, manager, req);
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
      logger.error("[Partner Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }

    return result;
  }

  private parseSheet(sheet: ExcelJS.Worksheet): RawPartnerRow[] {
    const rows: RawPartnerRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const code = String(row.getCell(1).value || "").trim();
      if (!code) return;
      rows.push({
        code,
        name: String(row.getCell(2).value || "").trim(),
        types: String(row.getCell(3).value || "").trim(),
        groupName: String(row.getCell(4).value || "").trim(),
        taxCode: String(row.getCell(5).value || "").trim(),
        phone: String(row.getCell(6).value || "").trim(),
        email: String(row.getCell(7).value || "").trim(),
        staffCode: String(row.getCell(8).value || "").trim(),
        paymentTermName: String(row.getCell(9).value || "").trim(),
        address: String(row.getCell(10).value || "").trim(),
        representativeName: String(row.getCell(11).value || "").trim(),
        representativePhone: String(row.getCell(12).value || "").trim(),
        bankName: String(row.getCell(13).value || "").trim(),
        bankAccount: String(row.getCell(14).value || "").trim(),
        note: String(row.getCell(15).value || "").trim(),
      });
    });
    return rows;
  }
}
