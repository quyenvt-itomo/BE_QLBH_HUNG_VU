import { FundTransaction } from "@/database/models/FundTransaction";
import { SimpleService } from "../_shared/simple.service";
import { FundTransactionRepository } from "./fundTransaction.repository";
export class FundTransactionService extends SimpleService<FundTransaction> { constructor(repository: FundTransactionRepository) { super(repository, "store"); } async validateBeforeCreate(): Promise<void> { throw new Error("fundTransaction.generated_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("fundTransaction.immutable"); } async validateBeforeDelete(): Promise<void> { throw new Error("fundTransaction.immutable"); } }
