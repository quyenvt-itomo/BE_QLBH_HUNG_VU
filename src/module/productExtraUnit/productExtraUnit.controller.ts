import { inject, injectable } from "inversify";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { BaseController } from "@/shared/base/BaseController";
import { ProductExtraUnitService } from "./productExtraUnit.service";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
@injectable()
export class ProductExtraUnitController extends BaseController<ProductExtraUnit> { protected service: ProductExtraUnitService; constructor(@inject(PRODUCT_EXTRA_UNIT_TYPES.Service) service: ProductExtraUnitService) { super(); this.service = service; } }
