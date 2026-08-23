import { FundTransfer } from "@/database/models/FundTransfer";
import { SimpleRepository } from "../_shared/simple.repository";
export class FundTransferRepository extends SimpleRepository<FundTransfer> { constructor() { super(FundTransfer); } }
