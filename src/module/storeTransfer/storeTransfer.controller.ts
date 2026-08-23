import { injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { StoreTransferService } from "./storeTransfer.service";

@injectable()
export class StoreTransferController extends BaseController<StoreTransfer> {
  protected service: StoreTransferService;
  constructor(service: StoreTransferService) { super(); this.service = service; }
}
