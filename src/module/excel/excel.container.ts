import { ContainerModule } from "inversify";
import { EXCEL_TYPES } from "./excel.types";
import { ExcelService } from "./excel.service";
import { ExcelController } from "./excel.controller";
import { ExcelRouter } from "./excel.route";
import { ProductExcelTemplate } from "./product/product.excel.template";
import { ProductExcelProcessor } from "./product/product.excel.processor";
import { PartnerExcelTemplate } from "./partner/partner.excel.template";
import { PartnerExcelProcessor } from "./partner/partner.excel.processor";
import { CustomerExcelTemplate } from "./customer/customer.excel.template";
import { CustomerExcelProcessor } from "./customer/customer.excel.processor";
import { SupplierExcelTemplate } from "./supplier/supplier.excel.template";
import { SupplierExcelProcessor } from "./supplier/supplier.excel.processor";

export const excelModule = new ContainerModule((bind) => {
  bind(EXCEL_TYPES.ExcelService).to(ExcelService);
  bind(EXCEL_TYPES.ExcelController).to(ExcelController);
  bind(EXCEL_TYPES.ExcelRouter).to(ExcelRouter);
  bind(EXCEL_TYPES.ProductExcelTemplate).to(ProductExcelTemplate);
  bind(EXCEL_TYPES.ProductExcelProcessor).to(ProductExcelProcessor);
  bind(EXCEL_TYPES.PartnerExcelTemplate).to(PartnerExcelTemplate);
  bind(EXCEL_TYPES.PartnerExcelProcessor).to(PartnerExcelProcessor);
  bind(EXCEL_TYPES.CustomerExcelTemplate).to(CustomerExcelTemplate);
  bind(EXCEL_TYPES.CustomerExcelProcessor).to(CustomerExcelProcessor);
  bind(EXCEL_TYPES.SupplierExcelTemplate).to(SupplierExcelTemplate);
  bind(EXCEL_TYPES.SupplierExcelProcessor).to(SupplierExcelProcessor);
});
