import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { ImportOptions, ImportResult } from "../excel.types";
import {
  EMPLOYEE_SHEET_NAMES,
  employeeStatusMap,
  genderMap,
  identityTypeMap,
  contractTypeMap,
  RawEmployeeRow,
  RawAllowanceRow,
  RawDeductionRow,
  RawContractRow,
} from "./employee.excel.types";
import { EMPLOYEE_TYPES } from "../../employee/employee.types";
import { EmployeeService } from "../../employee/employee.service";
import { ORGANIZATION_TYPES } from "../../organization/organization.types";
import { OrganizationService } from "../../organization/organization.service";
import { JOB_POSITION_TYPES } from "../../jobPosition/jobPosition.types";
import { JobPositionService } from "../../jobPosition/jobPosition.service";
import { BadRequestError } from "@/shared/types/errors";
import { RequestContext } from "@/shared/types/interfaces";
import {
  parseDateDMY,
  parseAddressFromExcel,
} from "@/shared/utils/address.util";
import {
  EmployeeContract,
  EmployeeContractTypeEnum,
} from "@/database/models/company/EmployeeContract";
import { Employee } from "@/database/models/company/Employee";
import logger from "@/shared/utils/logger";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ILike } from "typeorm";

const reverseGenderMap: Record<string, string> = {};
for (const [k, v] of Object.entries(genderMap)) reverseGenderMap[v] = k;
const reverseStatusMap: Record<string, string> = {};
for (const [k, v] of Object.entries(employeeStatusMap)) reverseStatusMap[v] = k;
const reverseIdentityMap: Record<string, string> = {};
for (const [k, v] of Object.entries(identityTypeMap)) reverseIdentityMap[v] = k;
const reverseContractMap: Record<string, string> = {};
for (const [k, v] of Object.entries(contractTypeMap)) reverseContractMap[v] = k;

type EmployeeImportData = Partial<
  Pick<
    Employee,
    | "code"
    | "name"
    | "gender"
    | "dob"
    | "maritalStatus"
    | "taxCode"
    | "ethnicity"
    | "religion"
    | "identification"
    | "email"
    | "phone"
    | "permanentAddress"
    | "currentAddress"
    | "emergencyContact"
    | "baseSalary"
    | "workingStatus"
    | "employeeStatus"
    | "trialDate"
    | "officialDate"
    | "bankAccount"
    | "insuranceInfo"
    | "allowances"
    | "deductions"
    | "note"
    | "workingOrganizationId"
    | "jobPositionId"
    | "storeId"
  >
>;

@injectable()
export class EmployeeExcelProcessor {
  constructor(
    @inject(EMPLOYEE_TYPES.EmployeeService)
    private employeeService: EmployeeService,
    @inject(ORGANIZATION_TYPES.OrganizationService)
    private organizationService: OrganizationService,
    @inject(JOB_POSITION_TYPES.JobPositionService)
    private jobPositionService: JobPositionService,
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
      const sheet = workbook.getWorksheet(EMPLOYEE_SHEET_NAMES.MAIN);
      if (!sheet)
        throw new BadRequestError(
          `Không tìm thấy sheet '${EMPLOYEE_SHEET_NAMES.MAIN}'`,
        );

      const rows = this.parseSheet(sheet);
      result.totalRows = rows.length;
      if (!rows.length) return result;

      // Parse sub-sheets
      const allowanceMap = this.parseAllowances(workbook);
      const deductionMap = this.parseDeductions(workbook);
      const contractMap = this.parseContracts(workbook);

      const storeId = req.storeContext?.storeId;
      if (!storeId) throw new BadRequestError("Thiếu thông tin công ty");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.code || !row.name)
            throw new Error("Thiếu mã hoặc tên nhân viên");

          const gender = row.gender
            ? reverseGenderMap[row.gender] || row.gender
            : undefined;
          const employeeStatus = row.employeeStatus
            ? reverseStatusMap[row.employeeStatus] || row.employeeStatus
            : undefined;

          // Resolve orgName → workingOrganizationId
          let workingOrganizationId: string | null = null;
          if (row.orgName) {
            const org = await this.organizationService.findOne({
              where: { name: ILike(row.orgName) },
            });
            workingOrganizationId = org?.id || null;
          }

          // Resolve jobPositionName → jobPositionId
          let jobPositionId: string | null = null;
          if (row.jobPositionName) {
            const jp = await this.jobPositionService.findOne({
              where: { name: ILike(row.jobPositionName), storeId },
            });
            jobPositionId = jp?.id || null;
          }

          const data: EmployeeImportData = {
            code: row.code,
            name: row.name,
            gender: gender as Employee["gender"] | undefined,
            dob: parseDateDMY(row.dob) || undefined,
            maritalStatus: (row.maritalStatus || null) as
              | Employee["maritalStatus"]
              | null,
            taxCode: row.taxCode || null,
            ethnicity: row.ethnicity || null,
            religion: row.religion || null,
            identification: (row.identityCode
              ? {
                  type: row.identityType
                    ? reverseIdentityMap[row.identityType] || row.identityType
                    : undefined,
                  identityCode: row.identityCode,
                  issuedDate: parseDateDMY(row.issuedDate) || undefined,
                  issuedPlace: row.issuedPlace || undefined,
                  expiredDate: parseDateDMY(row.expiredDate) || undefined,
                }
              : null) as Employee["identification"] | null,
            email: row.email || null,
            phone: row.phone || null,
            permanentAddress: parseAddressFromExcel(row.permanentAddress),
            currentAddress: parseAddressFromExcel(row.currentAddress),
            emergencyContact: row.emergencyName
              ? {
                  name: row.emergencyName,
                  phone: row.emergencyPhone || undefined,
                  relativetionship: row.emergencyRelationship || undefined,
                }
              : null,
            baseSalary: row.baseSalary ?? undefined,
            workingStatus: (row.workingStatus || null) as
              | Employee["workingStatus"]
              | null,
            employeeStatus: employeeStatus as
              | Employee["employeeStatus"]
              | undefined,
            trialDate: parseDateDMY(row.trialDate) || undefined,
            officialDate: parseDateDMY(row.officialDate) || undefined,
            workingOrganizationId,
            jobPositionId,
            bankAccount: row.bankName
              ? { bankName: row.bankName, accountNumber: row.bankAccount || "" }
              : null,
            insuranceInfo: row.insuranceNumber
              ? {
                  insuranceNumber: row.insuranceNumber,
                  startDate: parseDateDMY(row.insuranceStartDate) || undefined,
                  rate: row.insuranceRate || undefined,
                }
              : null,
            allowances: allowanceMap.get(row.code),
            deductions: deductionMap.get(row.code),
            note: row.note || null,
          };

          let savedEmployee: Employee | null = null;
          await withTransaction(async (manager) => {
            const existing = await this.employeeService.findOne({
              where: { code: row.code, storeId },
            });
            if (existing && options.duplicateHandling === "update") {
              savedEmployee = await this.employeeService.update(
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
              data.storeId = storeId;
              savedEmployee = await this.employeeService.create(
                data,
                manager,
                req,
              );
            }

            // Process contracts (separate sheet, handled via contract service/repo)
            const contracts = contractMap.get(row.code);
            if (contracts && contracts.length > 0 && savedEmployee) {
              const contractRepo = manager.getRepository(EmployeeContract);
              if (existing && options.duplicateHandling === "update") {
                await contractRepo.delete({
                  employeeId: savedEmployee.id,
                });
              }
              for (const c of contracts) {
                const contract = new EmployeeContract();
                contract.employeeId = savedEmployee.id;
                contract.contractNumber = c.contractNumber;
                contract.type = (reverseContractMap[c.type || ""] ||
                  c.type ||
                  "official") as EmployeeContractTypeEnum;
                contract.salary = c.salary ?? 0;
                contract.startDate = parseDateDMY(c.startDate) || null;
                contract.endDate = parseDateDMY(c.endDate) || null;
                await contractRepo.save(contract);
              }
            }
          });
          result.successRows++;
        } catch (err: unknown) {
          result.errorRows++;
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push({
            row: i + 3,
            message,
            data: row,
          });
          if (options.errorHandling === "stop_on_error") break;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("[Employee Import] Failed:", err);
      result.errors.push({ row: 0, message });
      result.errorRows = result.totalRows;
    }
    return result;
  }

  // ==================== Sheet parsers ====================

  private parseSheet(sheet: ExcelJS.Worksheet): RawEmployeeRow[] {
    const rows: RawEmployeeRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // skip group header + column header
      const code = String(row.getCell(1).value || "").trim();
      if (!code) return;
      rows.push({
        code,
        name: col(row, 2),
        gender: col(row, 3),
        dob: col(row, 4),
        maritalStatus: col(row, 5),
        taxCode: col(row, 6),
        ethnicity: col(row, 7),
        religion: col(row, 8),
        identityType: col(row, 9),
        identityCode: col(row, 10),
        issuedDate: col(row, 11),
        issuedPlace: col(row, 12),
        expiredDate: col(row, 13),
        email: col(row, 14),
        phone: col(row, 15),
        permanentAddress: col(row, 16),
        currentAddress: col(row, 17),
        emergencyName: col(row, 18),
        emergencyPhone: col(row, 19),
        emergencyRelationship: col(row, 20),
        orgName: col(row, 21),
        jobPositionName: col(row, 22),
        baseSalary: Number(row.getCell(23).value) || undefined,
        workingStatus: col(row, 24),
        employeeStatus: col(row, 25),
        trialDate: col(row, 26),
        officialDate: col(row, 27),
        bankName: col(row, 28),
        bankAccount: col(row, 29),
        insuranceNumber: col(row, 30),
        insuranceStartDate: col(row, 31),
        insuranceRate: Number(row.getCell(32).value) || undefined,
        note: col(row, 33),
      });
    });
    return rows;
  }

  private parseAllowances(
    workbook: ExcelJS.Workbook,
  ): Map<string, RawAllowanceRow[]> {
    return parseSubSheet(workbook, EMPLOYEE_SHEET_NAMES.ALLOWANCES, (row) => ({
      employeeCode: col(row, 1),
      name: col(row, 2),
      amount: Number(row.getCell(3).value) || undefined,
      note: col(row, 4),
    }));
  }

  private parseDeductions(
    workbook: ExcelJS.Workbook,
  ): Map<string, RawDeductionRow[]> {
    return parseSubSheet(workbook, EMPLOYEE_SHEET_NAMES.DEDUCTIONS, (row) => ({
      employeeCode: col(row, 1),
      name: col(row, 2),
      amount: Number(row.getCell(3).value) || undefined,
      note: col(row, 4),
    }));
  }

  private parseContracts(
    workbook: ExcelJS.Workbook,
  ): Map<string, RawContractRow[]> {
    return parseSubSheet(workbook, EMPLOYEE_SHEET_NAMES.CONTRACTS, (row) => ({
      employeeCode: col(row, 1),
      contractNumber: col(row, 2),
      type: col(row, 3),
      salary: Number(row.getCell(4).value) || undefined,
      startDate: col(row, 5),
      endDate: col(row, 6),
    }));
  }
}

// ==================== Helpers ====================

function col(row: ExcelJS.Row, num: number): string {
  return String(row.getCell(num).value || "").trim();
}

function parseSubSheet<T>(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  mapper: (row: ExcelJS.Row) => T,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return map;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 1) return;
    const code = col(row, 1);
    if (!code) return;
    const item = mapper(row);
    if (!map.has(code)) map.set(code, []);
    map.get(code)!.push(item);
  });
  return map;
}
