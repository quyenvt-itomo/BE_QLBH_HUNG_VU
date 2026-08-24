import { inject, injectable } from "inversify";
import { VatTransaction } from "@/database/models/VatTransaction";
import { BaseService } from "@/shared/base/BaseService";
import { VatTransactionRepository } from "./vatTransaction.repository";
import { VAT_TRANSACTION_TYPES } from "./vatTransaction.types";
@injectable()
export class VatTransactionService extends BaseService<VatTransaction> { protected repository: VatTransactionRepository; constructor(@inject(VAT_TRANSACTION_TYPES.Repository) repository: VatTransactionRepository) { super(); this.repository = repository; } async validateBeforeCreate(): Promise<void> { throw new Error("vatTransaction.generated_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("vatTransaction.immutable"); } async validateBeforeDelete(): Promise<void> { throw new Error("vatTransaction.immutable"); } }
