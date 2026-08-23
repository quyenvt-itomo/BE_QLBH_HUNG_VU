import { FundTransaction } from "@/database/models/FundTransaction";
import { SimpleRepository } from "../_shared/simple.repository";
export class FundTransactionRepository extends SimpleRepository<FundTransaction> { constructor() { super(FundTransaction); } }
