import { VatTransaction } from "@/database/models/VatTransaction";
import { SimpleRepository } from "../_shared/simple.repository";
export class VatTransactionRepository extends SimpleRepository<VatTransaction> { constructor() { super(VatTransaction); } }
