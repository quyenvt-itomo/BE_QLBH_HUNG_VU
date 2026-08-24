import { inject, injectable } from "inversify";
import { FundTransaction } from "@/database/models/FundTransaction";
import { BaseController } from "@/shared/base/BaseController";
import { FundTransactionService } from "./fundTransaction.service";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
@injectable()
export class FundTransactionController extends BaseController<FundTransaction> { protected service: FundTransactionService; constructor(@inject(FUND_TRANSACTION_TYPES.Service) service: FundTransactionService) { super(); this.service = service; } }
