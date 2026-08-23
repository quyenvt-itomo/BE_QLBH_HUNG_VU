import { injectable, inject } from "inversify";
import { FundTransferService } from "./fundTransfer.service";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
import { BaseController } from "@/shared/base/BaseController";
import { FundTransfer } from "@/database/models/FundTransfer";

@injectable()
export class FundTransferController extends BaseController<FundTransfer> {
  protected service: FundTransferService;

  constructor(
    @inject(FUND_TRANSFER_TYPES.FundTransferService)
    service: FundTransferService,
  ) {
    super();
    this.service = service;
  }
}
