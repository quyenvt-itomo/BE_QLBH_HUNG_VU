import { inject, injectable } from "inversify";
import ExcelJS from "exceljs";
import { RequestContext } from "@/shared/types/interfaces";
import { EXCEL_TYPES, ExcelEntityType, ExportColumnConfig } from "../excel.types";
import { PartnerExcelTemplate } from "../partner/partner.excel.template";
import { CUSTOMER_COLUMNS, PARTNER_EXCEL_CONFIGS } from "../partner/partner.excel.types";

@injectable()
export class CustomerExcelTemplate {
  constructor(
    @inject(EXCEL_TYPES.PartnerExcelTemplate)
    private partnerTemplate: PartnerExcelTemplate,
  ) {}

  generateTemplate(): Promise<ExcelJS.Workbook> {
    return this.partnerTemplate.generateTemplate(ExcelEntityType.CUSTOMER, PARTNER_EXCEL_CONFIGS.customer);
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
      { ...(filters || {}), type: "customer" },
      sheetColumns,
      { ...PARTNER_EXCEL_CONFIGS.customer, columns: columns.length ? columns : CUSTOMER_COLUMNS },
    );
  }
}
