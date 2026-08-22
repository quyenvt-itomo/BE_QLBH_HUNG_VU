import { ContainerModule } from "inversify";
import { COMMISSION_DEBT_REPORT_TYPES } from "./commissionDebtReport.types";
import { CommissionDebtReportController } from "./commissionDebtReport.controller";
import { CommissionDebtReportService } from "./commissionDebtReport.service";
import { CommissionDebtReportRouter } from "./commissionDebtReport.route";

export const commissionDebtReportModule = new ContainerModule((bind) => {
  bind<CommissionDebtReportController>(
    COMMISSION_DEBT_REPORT_TYPES.CommissionDebtReportController,
  ).to(CommissionDebtReportController);
  bind<CommissionDebtReportService>(
    COMMISSION_DEBT_REPORT_TYPES.CommissionDebtReportService,
  ).to(CommissionDebtReportService);
  bind<CommissionDebtReportRouter>(
    COMMISSION_DEBT_REPORT_TYPES.CommissionDebtReportRouter,
  ).to(CommissionDebtReportRouter);
});
