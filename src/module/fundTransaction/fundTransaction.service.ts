import { inject, injectable } from "inversify";
import { FundTransaction } from "@/database/models/FundTransaction";
import { BaseService } from "@/shared/base/BaseService";
import { FundTransactionRepository } from "./fundTransaction.repository";
import { FUND_TRANSACTION_TYPES } from "./fundTransaction.types";
@injectable()
export class FundTransactionService extends BaseService<FundTransaction> { protected repository: FundTransactionRepository; constructor(@inject(FUND_TRANSACTION_TYPES.Repository) repository: FundTransactionRepository) { super(); this.repository = repository; } async validateBeforeCreate(): Promise<void> { throw new Error("fundTransaction.generated_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("fundTransaction.immutable"); } async validateBeforeDelete(): Promise<void> { throw new Error("fundTransaction.immutable"); } }
