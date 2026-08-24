import { createSimpleModule } from "../_shared/simple.bind";
import { FUND_TYPES } from "./fund.types";
import { FundRepository } from "./fund.repository";
import { FundService } from "./fund.service";
import { FundController } from "./fund.controller";
import { FundRouter } from "./fund.route";
export const fundModule = createSimpleModule(
  FUND_TYPES,
  FundRepository,
  FundService,
  FundController,
  FundRouter,
);
