import { ContainerModule } from "inversify";
import { QUOTATION_COMMISSION_TYPES } from "./quotationCommission.types";
import { QuotationCommissionController } from "./quotationCommission.controller";
import { QuotationCommissionService } from "./quotationCommission.service";
import { QuotationCommissionRepository } from "./quotationCommission.repository";
import { QuotationCommissionRouter } from "./quotationCommission.route";

export const quotationCommissionModule = new ContainerModule((bind) => {
  bind<QuotationCommissionController>(
    QUOTATION_COMMISSION_TYPES.QuotationCommissionController,
  ).to(QuotationCommissionController);
  bind<QuotationCommissionService>(
    QUOTATION_COMMISSION_TYPES.QuotationCommissionService,
  ).to(QuotationCommissionService);
  bind<QuotationCommissionRepository>(
    QUOTATION_COMMISSION_TYPES.QuotationCommissionRepository,
  ).to(QuotationCommissionRepository);
  bind<QuotationCommissionRouter>(
    QUOTATION_COMMISSION_TYPES.QuotationCommissionRouter,
  ).to(QuotationCommissionRouter);
});
