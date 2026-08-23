import { ContainerModule } from "inversify";
import { FUND_ADJUSTMENT_TYPES } from "./fundAdjustment.types";
import { FundAdjustmentRepository } from "./fundAdjustment.repository";
import { FundAdjustmentService } from "./fundAdjustment.service";
import { FundAdjustmentController } from "./fundAdjustment.controller";
import { FundAdjustmentRouter } from "./fundAdjustment.route";
export const fundAdjustmentModule = new ContainerModule((bind) => { bind(FUND_ADJUSTMENT_TYPES.Repository).to(FundAdjustmentRepository); bind(FUND_ADJUSTMENT_TYPES.Service).to(FundAdjustmentService); bind(FUND_ADJUSTMENT_TYPES.Controller).to(FundAdjustmentController); bind(FUND_ADJUSTMENT_TYPES.Router).to(FundAdjustmentRouter); });
