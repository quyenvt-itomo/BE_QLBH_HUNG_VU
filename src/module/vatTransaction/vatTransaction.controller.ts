import { VatTransaction } from "@/database/models/VatTransaction";
import { SimpleController } from "../_shared/simple.controller";
import { VatTransactionService } from "./vatTransaction.service";
export class VatTransactionController extends SimpleController<VatTransaction> { constructor(service: VatTransactionService) { super(service); } }
