import { injectable, inject } from "inversify";
import { InventoryConversionService } from "./inventoryConversion.service";
import { INVENTORY_CONVERSION_TYPES } from "./inventoryConversion.types";
import { BaseController } from "@/shared/base/BaseController";
import { InventoryConversion } from "@/database/models/company/InventoryConversion";

@injectable()
export class InventoryConversionController extends BaseController<InventoryConversion> {
  protected service: InventoryConversionService;

  constructor(
    @inject(INVENTORY_CONVERSION_TYPES.InventoryConversionService)
    service: InventoryConversionService,
  ) {
    super();
    this.service = service;
  }
}
