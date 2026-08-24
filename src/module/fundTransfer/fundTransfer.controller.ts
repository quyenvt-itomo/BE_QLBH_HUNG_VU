import { inject, injectable } from "inversify";
import { FundTransfer } from "@/database/models/FundTransfer";
import { BaseController } from "@/shared/base/BaseController";
import { FundTransferService } from "./fundTransfer.service";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
@injectable()
export class FundTransferController extends BaseController<FundTransfer> { protected service: FundTransferService; constructor(@inject(FUND_TRANSFER_TYPES.Service) service: FundTransferService) { super(); this.service = service; } }
