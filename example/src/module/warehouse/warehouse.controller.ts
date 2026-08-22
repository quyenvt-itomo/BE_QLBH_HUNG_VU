import { injectable, inject } from "inversify";
import { WarehouseService } from "./warehouse.service";
import { WAREHOUSE_TYPES } from "./warehouse.types";
import { BaseController } from "@/shared/base/BaseController";
import { Warehouse } from "@/database/models/company/Warehouse";

@injectable()
export class WarehouseController extends BaseController<Warehouse> {
  protected service: WarehouseService;

  constructor(
    @inject(WAREHOUSE_TYPES.WarehouseService) service: WarehouseService,
  ) {
    super();
    this.service = service;
  }
}
