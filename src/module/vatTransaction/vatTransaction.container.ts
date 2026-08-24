import { createSimpleModule } from "../_shared/simple.bind";
import { VatTransactionRepository } from "./vatTransaction.repository";
import { VatTransactionService } from "./vatTransaction.service";
import { VatTransactionController } from "./vatTransaction.controller";
import { VatTransactionRouter } from "./vatTransaction.route";
import { VAT_TRANSACTION_TYPES } from "./vatTransaction.types";

export const vatTransactionModule = createSimpleModule(
  VAT_TRANSACTION_TYPES,
  VatTransactionRepository,
  VatTransactionService,
  VatTransactionController,
  VatTransactionRouter,
);
