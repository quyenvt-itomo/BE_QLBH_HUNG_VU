import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
import { ProductExtraUnit } from "@/database/models/company/ProductExtraUnit";

@injectable()
export class ProductExtraUnitService extends BaseService<ProductExtraUnit> {
  protected repository: ProductExtraUnitRepository;
  protected searchableFields = [];

  constructor(
    @inject(PRODUCT_EXTRA_UNIT_TYPES.ProductExtraUnitRepository)
    repository: ProductExtraUnitRepository,
  ) {
    super();
    this.repository = repository;
  }
}
