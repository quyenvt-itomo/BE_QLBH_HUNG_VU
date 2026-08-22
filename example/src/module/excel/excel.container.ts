import { ContainerModule } from "inversify";
import { EXCEL_TYPES } from "./excel.types";
import { ExcelService } from "./excel.service";
import { ExcelController } from "./excel.controller";
import { ExcelRouter } from "./excel.route";
// Partner
import { PartnerExcelTemplate } from "./partner/partner.excel.template";
import { PartnerExcelProcessor } from "./partner/partner.excel.processor";
// Employee
import { EmployeeExcelTemplate } from "./employee/employee.excel.template";
import { EmployeeExcelProcessor } from "./employee/employee.excel.processor";
// User
import { UserExcelTemplate } from "./user/user.excel.template";
import { UserExcelProcessor } from "./user/user.excel.processor";
// Product
import { ProductExcelTemplate } from "./product/product.excel.template";
import { ProductExcelProcessor } from "./product/product.excel.processor";
// Service
import { ServiceExcelTemplate } from "./service/service.excel.template";
import { ServiceExcelProcessor } from "./service/service.excel.processor";
// JobPosition
import { JobPositionExcelTemplate } from "./jobPosition/jobPosition.excel.template";
import { JobPositionExcelProcessor } from "./jobPosition/jobPosition.excel.processor";
// Warehouse
import { WarehouseExcelTemplate } from "./warehouse/warehouse.excel.template";
import { WarehouseExcelProcessor } from "./warehouse/warehouse.excel.processor";
// PriceHistory
import { PriceHistoryExcelTemplate } from "./priceHistory/priceHistory.excel.template";

const excelModule = new ContainerModule((bind) => {
  bind(EXCEL_TYPES.ExcelService).to(ExcelService);
  bind(EXCEL_TYPES.ExcelController).to(ExcelController);
  bind(EXCEL_TYPES.ExcelRouter).to(ExcelRouter);

  // Partner
  bind(EXCEL_TYPES.PartnerExcelTemplate).to(PartnerExcelTemplate);
  bind(EXCEL_TYPES.PartnerExcelProcessor).to(PartnerExcelProcessor);

  // Employee
  bind(EXCEL_TYPES.EmployeeExcelTemplate).to(EmployeeExcelTemplate);
  bind(EXCEL_TYPES.EmployeeExcelProcessor).to(EmployeeExcelProcessor);

  // User
  bind(EXCEL_TYPES.UserExcelTemplate).to(UserExcelTemplate);
  bind(EXCEL_TYPES.UserExcelProcessor).to(UserExcelProcessor);

  // Product
  bind(EXCEL_TYPES.ProductExcelTemplate).to(ProductExcelTemplate);
  bind(EXCEL_TYPES.ProductExcelProcessor).to(ProductExcelProcessor);

  // Service
  bind(EXCEL_TYPES.ServiceExcelTemplate).to(ServiceExcelTemplate);
  bind(EXCEL_TYPES.ServiceExcelProcessor).to(ServiceExcelProcessor);

  // JobPosition
  bind(EXCEL_TYPES.JobPositionExcelTemplate).to(JobPositionExcelTemplate);
  bind(EXCEL_TYPES.JobPositionExcelProcessor).to(JobPositionExcelProcessor);

  // Warehouse
  bind(EXCEL_TYPES.WarehouseExcelTemplate).to(WarehouseExcelTemplate);
  bind(EXCEL_TYPES.WarehouseExcelProcessor).to(WarehouseExcelProcessor);

  // PriceHistory (export only)
  bind(EXCEL_TYPES.PriceHistoryExcelTemplate).to(PriceHistoryExcelTemplate);
});

export { excelModule };
