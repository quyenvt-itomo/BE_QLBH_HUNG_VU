import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { FundTransfer } from "@/database/models/FundTransfer";
import { FundTransferService } from "./fundTransfer.service";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";

@injectable()
export class FundTransferController extends BaseController<FundTransfer> {
  protected service: FundTransferService;
  constructor(
    @inject(FUND_TRANSFER_TYPES.FundTransferService)
    protected FundTransferService: FundTransferService,
  ) {
    super();
    this.service = FundTransferService;
  }
}
