import { ContainerModule } from "inversify";
import { FUND_TYPES } from "./fund.types";
import { FundController } from "./fund.controller";
import { FundService } from "./fund.service";
import { FundRepository } from "./fund.repository";
import { FundRouter } from "./fund.route";

export const fundModule = new ContainerModule((bind) => {
  bind<FundController>(FUND_TYPES.FundController).to(FundController);
  bind<FundService>(FUND_TYPES.FundService).to(FundService);
  bind<FundRepository>(FUND_TYPES.FundRepository).to(FundRepository);
  bind<FundRouter>(FUND_TYPES.FundRouter).to(FundRouter);
});
