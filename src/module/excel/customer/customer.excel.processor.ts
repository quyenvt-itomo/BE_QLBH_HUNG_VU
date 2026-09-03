import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import { RequestContext } from "@/shared/types/interfaces";
import { EXCEL_TYPES, ExcelEntityType, ImportOptions, ImportProgressCallback, ImportResult } from "../excel.types";
import { PartnerExcelProcessor } from "../partner/partner.excel.processor";
import { PARTNER_EXCEL_CONFIGS } from "../partner/partner.excel.types";

@injectable()
export class CustomerExcelProcessor {
  constructor(
    @inject(EXCEL_TYPES.PartnerExcelProcessor)
    private partnerProcessor: PartnerExcelProcessor,
  ) {}

  processImport(
    req: RequestContext,
    workbook: ExcelJS.Workbook,
    options: ImportOptions,
    onProgress?: ImportProgressCallback,
  ): Promise<ImportResult> {
    return this.partnerProcessor.processImport(
      req,
      workbook,
      { ...options, entityType: ExcelEntityType.CUSTOMER },
      onProgress,
      PARTNER_EXCEL_CONFIGS.customer,
    );
  }
}
