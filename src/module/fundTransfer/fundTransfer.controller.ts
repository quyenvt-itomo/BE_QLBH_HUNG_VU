import { FundTransfer } from "@/database/models/FundTransfer";
import { SimpleController } from "../_shared/simple.controller";
import { FundTransferService } from "./fundTransfer.service";
export class FundTransferController extends SimpleController<FundTransfer> { constructor(service: FundTransferService) { super(service); } }
