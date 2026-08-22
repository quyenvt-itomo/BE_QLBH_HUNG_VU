import { ContainerModule } from "inversify";
import { VAT_DEBT_REPORT_TYPES } from "./vatDebtReport.types";
import { VatDebtReportController } from "./vatDebtReport.controller";
import { VatDebtReportService } from "./vatDebtReport.service";
import { VatDebtReportRouter } from "./vatDebtReport.route";

export const vatDebtReportModule = new ContainerModule((bind) => {
  bind<VatDebtReportController>(
    VAT_DEBT_REPORT_TYPES.VatDebtReportController,
  ).to(VatDebtReportController);
  bind<VatDebtReportService>(VAT_DEBT_REPORT_TYPES.VatDebtReportService).to(
    VatDebtReportService,
  );
  bind<VatDebtReportRouter>(VAT_DEBT_REPORT_TYPES.VatDebtReportRouter).to(
    VatDebtReportRouter,
  );
});
