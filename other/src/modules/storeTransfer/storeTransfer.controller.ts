import { BaseController } from "@/shared/base/BaseController";
import { StoreTransferService } from "./storeTransfer.service";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { inject, injectable } from "inversify";
import { StoreTransfer } from "@/database/models/StoreTransfer";

/**
 * StoreTransfer Controller - Tenant Entity
 */
@injectable()
export class StoreTransferController extends BaseController<StoreTransfer> {
  protected service: StoreTransferService;

  constructor(
    @inject(STORE_TRANSFER_TYPES.StoreTransferService)
    service: StoreTransferService,
  ) {
    super();
    this.service = service;
  }
}
