import { ContainerModule } from "inversify";
import { FUND_TYPES } from "./fund.types";
import { FundRepository } from "./fund.repository";
import { FundService } from "./fund.service";
import { FundController } from "./fund.controller";
import { FundRouter } from "./fund.route";
export const fundModule = new ContainerModule((bind) => {
  bind(FUND_TYPES.Repository).to(FundRepository).inSingletonScope();
  bind(FUND_TYPES.Service).to(FundService).inSingletonScope();
  bind(FUND_TYPES.Controller).to(FundController).inSingletonScope();
  bind(FUND_TYPES.Router).to(FundRouter).inSingletonScope();
});
