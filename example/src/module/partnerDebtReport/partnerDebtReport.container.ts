import { ContainerModule } from "inversify";
import { PARTNER_DEBT_REPORT_TYPES } from "./partnerDebtReport.types";
import { PartnerDebtReportController } from "./partnerDebtReport.controller";
import { PartnerDebtReportService } from "./partnerDebtReport.service";
import { PartnerDebtReportRouter } from "./partnerDebtReport.route";

export const partnerDebtReportModule = new ContainerModule((bind) => {
  bind<PartnerDebtReportController>(
    PARTNER_DEBT_REPORT_TYPES.PartnerDebtReportController,
  ).to(PartnerDebtReportController);
  bind<PartnerDebtReportService>(
    PARTNER_DEBT_REPORT_TYPES.PartnerDebtReportService,
  ).to(PartnerDebtReportService);
  bind<PartnerDebtReportRouter>(
    PARTNER_DEBT_REPORT_TYPES.PartnerDebtReportRouter,
  ).to(PartnerDebtReportRouter);
});
