import { injectable, inject } from "inversify";
import { ProductExtraUnitService } from "./productExtraUnit.service";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
import { BaseController } from "@/shared/base/BaseController";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";

@injectable()
export class ProductExtraUnitController extends BaseController<ProductExtraUnit> {
  protected service: ProductExtraUnitService;

  constructor(
    @inject(PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitService)
    service: ProductExtraUnitService,
  ) {
    super();
    this.service = service;
  }
}
