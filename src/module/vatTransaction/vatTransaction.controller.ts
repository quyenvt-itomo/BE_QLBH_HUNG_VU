import { inject, injectable } from "inversify";
import { VatTransaction } from "@/database/models/VatTransaction";
import { BaseController } from "@/shared/base/BaseController";
import { VatTransactionService } from "./vatTransaction.service";
import { VAT_TRANSACTION_TYPES } from "./vatTransaction.types";
@injectable()
export class VatTransactionController extends BaseController<VatTransaction> { protected service: VatTransactionService; constructor(@inject(VAT_TRANSACTION_TYPES.Service) service: VatTransactionService) { super(); this.service = service; } }
