import { ContainerModule } from "inversify";
import { EXCEL_TYPES } from "./excel.types";
import { ExcelService } from "./excel.service";
import { ExcelController } from "./excel.controller";
import { ExcelRouter } from "./excel.route";
import { ProductExcelTemplate } from "./product/product.template";
import { ProductExcelProcessor } from "./product/product.processor";
import { CustomerExcelTemplate } from "./customer/customer.template";
import { CustomerExcelProcessor } from "./customer/customer.processor";
import { SaleOrderExcelTemplate } from "./saleOrder/saleOrder.template";
import { SaleOrderExcelProcessor } from "./saleOrder/saleOrder.processor";
import { InventoryAdjustmentExcelTemplate } from "./inventoryAdjustment/inventoryAdjustment.template";
import { InventoryReportExcelTemplate } from "./inventoryReport/inventoryReport.template";
import { DashboardExcelTemplate } from "./dashboard/dashboard.template";
import { IncomeExpenseExcelTemplate } from "./incomeExpense/incomeExpense.template";

export const excelModule = new ContainerModule((bind) => {
  bind<ExcelService>(EXCEL_TYPES.ExcelService).to(ExcelService);
  bind<ExcelController>(EXCEL_TYPES.ExcelController).to(ExcelController);
  bind<ExcelRouter>(EXCEL_TYPES.ExcelRouter).to(ExcelRouter);

  // Templates
  bind<ProductExcelTemplate>(EXCEL_TYPES.ProductExcelTemplate).to(
    ProductExcelTemplate,
  );
  bind<CustomerExcelTemplate>(EXCEL_TYPES.CustomerExcelTemplate).to(
    CustomerExcelTemplate,
  );
  bind<SaleOrderExcelTemplate>(EXCEL_TYPES.SaleOrderExcelTemplate).to(
    SaleOrderExcelTemplate,
  );
  bind<InventoryAdjustmentExcelTemplate>(
    EXCEL_TYPES.InventoryAdjustmentExcelTemplate,
  ).to(InventoryAdjustmentExcelTemplate);
  bind<InventoryReportExcelTemplate>(
    EXCEL_TYPES.InventoryReportExcelTemplate,
  ).to(InventoryReportExcelTemplate);
  bind<DashboardExcelTemplate>(EXCEL_TYPES.DashboardExcelTemplate).to(
    DashboardExcelTemplate,
  );
  bind<IncomeExpenseExcelTemplate>(EXCEL_TYPES.IncomeExpenseExcelTemplate).to(
    IncomeExpenseExcelTemplate,
  );

  // Processors
  bind<ProductExcelProcessor>(EXCEL_TYPES.ProductExcelProcessor).to(
    ProductExcelProcessor,
  );
  bind<CustomerExcelProcessor>(EXCEL_TYPES.CustomerExcelProcessor).to(
    CustomerExcelProcessor,
  );
  bind<SaleOrderExcelProcessor>(EXCEL_TYPES.SaleOrderExcelProcessor).to(
    SaleOrderExcelProcessor,
  );
});
