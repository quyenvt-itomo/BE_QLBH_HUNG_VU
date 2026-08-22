import { injectable, inject } from "inversify";
import { WarehouseTransferService } from "./warehouseTransfer.service";
import { WAREHOUSE_TRANSFER_TYPES } from "./warehouseTransfer.types";
import { BaseController } from "@/shared/base/BaseController";
import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { ConfirmTransferSchema } from "./warehouseTransfer.validator";

@injectable()
export class WarehouseTransferController extends BaseController<WarehouseTransfer> {
  protected service: WarehouseTransferService;

  constructor(
    @inject(WAREHOUSE_TRANSFER_TYPES.WarehouseTransferService)
    service: WarehouseTransferService,
  ) {
    super();
    this.service = service;
  }

  confirmExport = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = ConfirmTransferSchema.parse(req.body);
    const data = await this.service.confirmExport(id, dto, req);
    this.sendResponse({ res, data });
  });

  confirmImport = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = ConfirmTransferSchema.parse(req.body);
    const data = await this.service.confirmImport(id, dto, req);
    this.sendResponse({ res, data });
  });
}
