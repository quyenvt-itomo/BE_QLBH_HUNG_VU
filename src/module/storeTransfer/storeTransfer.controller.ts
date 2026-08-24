import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { StoreTransferService } from "./storeTransfer.service";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";

@injectable()
export class StoreTransferController extends BaseController<StoreTransfer> {
  protected service: StoreTransferService;
  constructor(@inject(STORE_TRANSFER_TYPES.Service) service: StoreTransferService) { super(); this.service = service; }
}
