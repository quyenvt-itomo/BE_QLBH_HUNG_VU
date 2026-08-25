import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager, Not } from "typeorm";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { ProductExtraUnitRepository } from "./productExtraUnit.repository";
import { PRODUCT_EXTRA_UNIT_TYPES } from "./productExtraUnit.types";
@injectable()
export class ProductExtraUnitService extends BaseService<ProductExtraUnit> {
  protected repository: ProductExtraUnitRepository;
  protected uniqueFields: (keyof ProductExtraUnit)[] = ["productId", "unitId"];

  constructor(
    @inject(PRODUCT_EXTRA_UNIT_TYPES.Repository)
    repository: ProductExtraUnitRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<ProductExtraUnit>,
    _manager: EntityManager,
    _req?: RequestContext,
  ): Promise<void> {
    if (data.isPurchaseUnit == null) data.isPurchaseUnit = false;
  }

  async actionAfterCreate(
    data: ProductExtraUnit,
    manager: EntityManager,
  ): Promise<void> {
    if (data.isPurchaseUnit) await this.clearOtherPurchaseUnits(data, manager);
  }

  async actionAfterUpdate(
    data: ProductExtraUnit,
    manager: EntityManager,
  ): Promise<void> {
    if (data.isPurchaseUnit) await this.clearOtherPurchaseUnits(data, manager);
  }

  private async clearOtherPurchaseUnits(
    data: ProductExtraUnit,
    manager: EntityManager,
  ): Promise<void> {
    await this.repository.getRepository(manager).update(
      {
        productId: data.productId,
        id: Not(data.id),
      } as any,
      { isPurchaseUnit: false },
    );
  }
}
