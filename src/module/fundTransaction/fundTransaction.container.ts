import { ContainerModule } from "inversify";
import { FundTransactionRepository } from "./fundTransaction.repository";
import { FundTransactionService } from "./fundTransaction.service";
import { FundTransactionController } from "./fundTransaction.controller";
import { FundTransactionRouter } from "./fundTransaction.route";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";

export const fundTransactionModule = new ContainerModule((bind) => { bind(FUND_TRANSACTION_TYPES.Repository).to(FundTransactionRepository).inSingletonScope(); bind(FUND_TRANSACTION_TYPES.Service).to(FundTransactionService).inSingletonScope(); bind(FUND_TRANSACTION_TYPES.Controller).to(FundTransactionController).inSingletonScope(); bind(FUND_TRANSACTION_TYPES.Router).to(FundTransactionRouter).inSingletonScope(); });
