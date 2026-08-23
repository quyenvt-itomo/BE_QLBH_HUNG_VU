import { FundTransfer } from "@/database/models/FundTransfer";
import { SimpleService } from "../_shared/simple.service";
import { FundTransferRepository } from "./fundTransfer.repository";
export class FundTransferService extends SimpleService<FundTransfer> { constructor(repository: FundTransferRepository) { super(repository, "store", "fundtransfer"); } }
