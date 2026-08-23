import { FundTransaction } from "@/database/models/FundTransaction";
import { SimpleController } from "../_shared/simple.controller";
import { FundTransactionService } from "./fundTransaction.service";
export class FundTransactionController extends SimpleController<FundTransaction> { constructor(service: FundTransactionService) { super(service); } }
