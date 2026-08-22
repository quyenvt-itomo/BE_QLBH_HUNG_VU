import { injectable, inject } from "inversify";
import { WarehouseTransferLineService } from "./warehouseTransferLine.service";
import { WAREHOUSE_TRANSFER_LINE_TYPES } from "./warehouseTransferLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { WarehouseTransferLine } from "@/database/models/company/WarehouseTransferLine";

@injectable()
export class WarehouseTransferLineController extends BaseController<WarehouseTransferLine> {
  protected service: WarehouseTransferLineService;

  constructor(
    @inject(WAREHOUSE_TRANSFER_LINE_TYPES.WarehouseTransferLineService)
    service: WarehouseTransferLineService,
  ) {
    super();
    this.service = service;
  }
}
