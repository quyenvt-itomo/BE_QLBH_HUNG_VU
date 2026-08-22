import { injectable, inject } from "inversify";
import { StoreTransferLineService } from "./storeTransferLine.service";
import { STORE_TRANSFER_LINE_TYPES } from "./storeTransferLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { StoreTransferLine } from "@/database/models/StoreTransferLine";

/**
 * StoreTransferLine Controller - Tenant Entity
 */
@injectable()
export class StoreTransferLineController extends BaseController<StoreTransferLine> {
  protected service: StoreTransferLineService;

  constructor(
    @inject(STORE_TRANSFER_LINE_TYPES.StoreTransferLineService)
    service: StoreTransferLineService,
  ) {
    super();
    this.service = service;
  }
}
