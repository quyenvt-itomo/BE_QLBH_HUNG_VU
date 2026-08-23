import { VatTransaction } from "@/database/models/VatTransaction";
import { SimpleService } from "../_shared/simple.service";
import { VatTransactionRepository } from "./vatTransaction.repository";
export class VatTransactionService extends SimpleService<VatTransaction> { constructor(repository: VatTransactionRepository) { super(repository, "store"); } async validateBeforeCreate(): Promise<void> { throw new Error("vatTransaction.generated_only"); } async validateBeforeUpdate(): Promise<void> { throw new Error("vatTransaction.immutable"); } async validateBeforeDelete(): Promise<void> { throw new Error("vatTransaction.immutable"); } }
