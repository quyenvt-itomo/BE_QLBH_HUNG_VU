import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import { RequestContext } from "@/shared/types/interfaces";
import { EXCEL_TYPES, ExcelEntityType, ExportColumnConfig } from "../excel.types";
import { PartnerExcelTemplate } from "../partner/partner.excel.template";
import { PARTNER_EXCEL_CONFIGS, SUPPLIER_COLUMNS } from "../partner/partner.excel.types";

@injectable()
export class SupplierExcelTemplate {
  constructor(
    @inject(EXCEL_TYPES.PartnerExcelTemplate)
    private partnerTemplate: PartnerExcelTemplate,
  ) {}

  generateTemplate(): Promise<ExcelJS.Workbook> {
    return this.partnerTemplate.generateTemplate(ExcelEntityType.SUPPLIER, PARTNER_EXCEL_CONFIGS.supplier);
  }

  exportData(
    req: RequestContext,
    columns: ExportColumnConfig[],
    filters?: Record<string, any>,
    sheetColumns?: Record<string, ExportColumnConfig[]>,
  ): Promise<ExcelJS.Workbook> {
    return this.partnerTemplate.exportData(
      req,
      columns,
      { ...(filters || {}), type: "supplier" },
      sheetColumns,
      { ...PARTNER_EXCEL_CONFIGS.supplier, columns: columns.length ? columns : SUPPLIER_COLUMNS },
    );
  }
}
