import { ContainerModule } from "inversify";
import { FUND_BALANCE_REPORT_TYPES } from "./fundBalanceReport.types";
import { FundBalanceReportController } from "./fundBalanceReport.controller";
import { FundBalanceReportService } from "./fundBalanceReport.service";
import { FundBalanceReportRouter } from "./fundBalanceReport.route";

export const fundBalanceReportModule = new ContainerModule((bind) => {
  bind<FundBalanceReportController>(
    FUND_BALANCE_REPORT_TYPES.FundBalanceReportController,
  ).to(FundBalanceReportController);
  bind<FundBalanceReportService>(
    FUND_BALANCE_REPORT_TYPES.FundBalanceReportService,
  ).to(FundBalanceReportService);
  bind<FundBalanceReportRouter>(
    FUND_BALANCE_REPORT_TYPES.FundBalanceReportRouter,
  ).to(FundBalanceReportRouter);
});
