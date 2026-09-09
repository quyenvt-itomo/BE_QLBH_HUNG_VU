import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { StoreTransferService } from "./storeTransfer.service";
import { STORE_TRANSFER_TYPES } from "./storeTransfer.types";
import { asyncHandler } from "@/shared/utils/controller.utils";

@injectable()
export class StoreTransferController extends BaseController<StoreTransfer> {
  protected service: StoreTransferService;
  constructor(@inject(STORE_TRANSFER_TYPES.Service) service: StoreTransferService) { super(); this.service = service; }

  exportTransfer = asyncHandler(async (req, res) => {
    const data = await this.service.exportTransfer(
      req.params.id,
      this.service.getReqContext(req),
    );
    this.sendResponse({ res, data });
  });

  importTransfer = asyncHandler(async (req, res) => {
    const data = await this.service.importTransfer(
      req.params.id,
      this.service.getReqContext(req),
    );
    this.sendResponse({ res, data });
  });

  cancel = asyncHandler(async (req, res) => {
    const data = await this.service.cancel(
      req.params.id,
      this.service.getReqContext(req),
    );
    this.sendResponse({ res, data });
  });
}
