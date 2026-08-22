import { ContainerModule } from "inversify";
import { FundTransactionController } from "./fundTransaction.controller";
import { FundTransactionService } from "./fundTransaction.service";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
import { FundTransactionRouter } from "./fundTransaction.route";
import { FundTransactionRecalculate } from "./fundTransactionRecaculate.service";

const fundTransactionModule = new ContainerModule((bind) => {
  bind<FundTransactionService>(
    FUND_TRANSACTION_TYPES.FundTransactionService,
  ).to(FundTransactionService);
  bind<FundTransactionController>(
    FUND_TRANSACTION_TYPES.FundTransactionController,
  ).to(FundTransactionController);
  bind<FundTransactionRouter>(FUND_TRANSACTION_TYPES.FundTransactionRouter).to(
    FundTransactionRouter,
  );
  bind<FundTransactionRecalculate>(
    FUND_TRANSACTION_TYPES.FundTransactionRecalculate,
  ).to(FundTransactionRecalculate);
});

export { fundTransactionModule };
