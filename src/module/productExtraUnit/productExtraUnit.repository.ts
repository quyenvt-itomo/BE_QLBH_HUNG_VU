import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { ProductExtraUnit } from "@/database/models/ProductExtraUnit";
import {
  ProductExtraUnitSelectFull,
  ProductExtraUnitRelations,
} from "./productExtraUnit.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { ProductExtraUnitQueryDto } from "./productExtraUnit.validator";

@injectable()
export class ProductExtraUnitRepository extends BaseRepository<ProductExtraUnit> {
  protected entityClass = ProductExtraUnit;
  protected selectedFields = ProductExtraUnitSelectFull;
  protected relations = ProductExtraUnitRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<ProductExtraUnit>,
    options: IFindPaginationOptions<ProductExtraUnit>,
  ): Promise<void> {
    const alias = qb.alias;
    const { productId, unitId } =
      (options?.moreQuery as ProductExtraUnitQueryDto) || {};
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
    if (unitId) {
      qb.andWhere(`${alias}.unitId = :unitId`, { unitId });
    }
  }
}
