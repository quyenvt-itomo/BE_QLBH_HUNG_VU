import { ContainerModule } from "inversify";
import { VatTransactionRepository } from "./vatTransaction.repository";
import { VatTransactionService } from "./vatTransaction.service";
import { VatTransactionController } from "./vatTransaction.controller";
import { VatTransactionRouter } from "./vatTransaction.route";
import { VAT_TRANSACTION_TYPES } from "./vatTransaction.types";

export const vatTransactionModule = new ContainerModule((bind) => { bind(VAT_TRANSACTION_TYPES.Repository).to(VatTransactionRepository).inSingletonScope(); bind(VAT_TRANSACTION_TYPES.Service).to(VatTransactionService).inSingletonScope(); bind(VAT_TRANSACTION_TYPES.Controller).to(VatTransactionController).inSingletonScope(); bind(VAT_TRANSACTION_TYPES.Router).to(VatTransactionRouter).inSingletonScope(); });
