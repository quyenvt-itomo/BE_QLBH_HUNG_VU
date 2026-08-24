import { createSimpleModule } from "../_shared/simple.bind";
import { FundTransactionRepository } from "./fundTransaction.repository";
import { FundTransactionService } from "./fundTransaction.service";
import { FundTransactionController } from "./fundTransaction.controller";
import { FundTransactionRouter } from "./fundTransaction.route";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";

export const fundTransactionModule = createSimpleModule(
  FUND_TRANSACTION_TYPES,
  FundTransactionRepository,
  FundTransactionService,
  FundTransactionController,
  FundTransactionRouter,
);
